#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "${script_dir}/.." && pwd)"
client_dir="${root_dir}/client"
features_dir="${client_dir}/src/features"
layouts_dir="${client_dir}/src/app/layouts"
routes_file="${client_dir}/src/app/routes.jsx"

if [[ ! -d "${layouts_dir}" ]]; then
  echo "Layouts directory not found: ${layouts_dir}" >&2
  exit 1
fi

if [[ ! -f "${routes_file}" ]]; then
  echo "Routes file not found: ${routes_file}" >&2
  exit 1
fi

mapfile -t layout_files < <(find "${layouts_dir}" -maxdepth 1 -type f \( -name "*.jsx" -o -name "*.js" \) -printf "%f\n" | sort)
layout_names=()
for layout_file in "${layout_files[@]}"; do
  layout_names+=("${layout_file%.*}")
done

if [[ ${#layout_names[@]} -eq 0 ]]; then
  echo "No layouts were found to attach the route." >&2
  exit 1
fi

echo "Available layouts:"
for i in "${!layout_names[@]}"; do
  printf "  %d. %s\n" "$((i + 1))" "${layout_names[$i]}"
done

read -r -p "Select a layout by number or name: " layout_answer
selected_layout=""
if [[ "${layout_answer}" =~ ^[0-9]+$ ]]; then
  index=$((layout_answer - 1))
  if (( index >= 0 && index < ${#layout_names[@]} )); then
    selected_layout="${layout_names[$index]}"
  fi
fi

if [[ -z "${selected_layout}" ]]; then
  layout_answer_lower=$(echo "${layout_answer}" | tr '[:upper:]' '[:lower:]')
  for layout in "${layout_names[@]}"; do
    if [[ "${layout,,}" == "${layout_answer_lower}" ]]; then
      selected_layout="${layout}"
      break
    fi
  done
fi

if [[ -z "${selected_layout}" ]]; then
  echo "A valid layout selection is required." >&2
  exit 1
fi

read -r -p "Feature key (kebab-case, e.g. reports-insights): " feature_key_input
feature_key=$(echo "${feature_key_input}" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g' | sed -E 's/-+/-/g' | sed -E 's/^-+|-+$//g')
if [[ -z "${feature_key}" ]]; then
  echo "Feature key cannot be empty." >&2
  exit 1
fi

if [[ ! "${feature_key}" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Feature key must be kebab-case using letters, numbers, and single dashes." >&2
  exit 1
fi

default_route="/${feature_key}"
if [[ "${feature_key}" == "home" ]]; then
  default_route="/"
fi

read -r -p "Route path (default \"${default_route}\"): " route_answer
route_path="${route_answer:-${default_route}}"
if [[ -z "${route_path}" ]]; then
  route_path="${default_route}"
fi
if [[ "${route_path}" != /* ]]; then
  route_path="/${route_path}"
fi
if [[ "${route_path}" != "/" ]]; then
  route_path="${route_path%/}"
fi
if [[ ! "${route_path}" =~ ^/[A-Za-z0-9/-]*$ ]]; then
  echo "Route path may only contain letters, numbers, dashes, and forward slashes." >&2
  exit 1
fi

route_path_relative="${route_path#/}"
route_path_relative="${route_path_relative%/}"
if [[ -n "${route_path_relative}" ]] && grep -Fq "path: \"${route_path_relative}\"" "${routes_file}"; then
  echo "Route path ${route_path} is already defined in the router." >&2
  exit 1
fi

function to_pascal_case() {
  local input="$1"
  local sanitized
  sanitized=$(echo "${input}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/ /g')
  local result=""
  for word in ${sanitized}; do
    if [[ -n "${word}" ]]; then
      local first
      local rest
      first=$(printf '%s' "${word}" | cut -c1 | tr '[:lower:]' '[:upper:]')
      rest=$(printf '%s' "${word}" | cut -c2-)
      result+="${first}${rest}"
    fi
  done
  printf '%s' "${result}"
}

function to_title_case() {
  local input="$1"
  local sanitized
  sanitized=$(echo "${input}" | sed 's/[^A-Za-z0-9]/ /g')
  local result=""
  for word in ${sanitized}; do
    if [[ -n "${word}" ]]; then
      local lower
      local first
      local rest
      lower=$(echo "${word}" | tr '[:upper:]' '[:lower:]')
      first=$(printf '%s' "${lower}" | cut -c1 | tr '[:lower:]' '[:upper:]')
      rest=$(printf '%s' "${lower}" | cut -c2-)
      if [[ -n "${result}" ]]; then
        result+=" "
      fi
      result+="${first}${rest}"
    fi
  done
  printf '%s' "${result}"
}

default_component="$(to_pascal_case "${feature_key}")Page"
read -r -p "Page component name (default \"${default_component}\"): " component_answer
if [[ -n "${component_answer}" ]]; then
  page_component="$(to_pascal_case "${component_answer}")"
else
  page_component="${default_component}"
fi

if [[ -z "${page_component}" ]]; then
  echo "Page component name cannot be empty." >&2
  exit 1
fi

default_title="$(to_title_case "${feature_key}")"
if [[ -z "${default_title}" ]]; then
  default_title="New Feature"
fi
read -r -p "Page title (default \"${default_title}\"): " title_answer
if [[ -n "${title_answer}" ]]; then
  page_title="${title_answer}"
else
  page_title="${default_title}"
fi

feature_dir="${features_dir}/${feature_key}"
if [[ -e "${feature_dir}" ]]; then
  echo "Directory already exists: ${feature_dir}" >&2
  exit 1
fi

pages_dir="${feature_dir}/pages"
components_dir="${feature_dir}/components"

mkdir -p "${pages_dir}" "${components_dir}"

index_file="${feature_dir}/index.js"

page_file="${pages_dir}/${page_component}.jsx"
page_title_lower=$(echo "${page_title}" | tr '[:upper:]' '[:lower:]')
cat > "${page_file}" <<EOF_PAGE
export function ${page_component}() {
  return (
    <section className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">${page_title}</h1>
        <p className="text-sm text-muted-foreground">
          Replace this copy with the implementation details for the ${page_title_lower}.
        </p>
      </header>
    </section>
  );
}
EOF_PAGE

touch "${components_dir}/.gitkeep"

function to_camel_case() {
  local input="$1"
  local pascal
  pascal="$(to_pascal_case "${input}")"
  if [[ -z "${pascal}" ]]; then
    printf ''
    return
  fi
  local first rest
  first=$(printf '%s' "${pascal}" | cut -c1 | tr '[:upper:]' '[:lower:]')
  rest=$(printf '%s' "${pascal}" | cut -c2-)
  printf '%s%s' "${first}" "${rest}"
}

routes_const_name="$(to_camel_case "${feature_key}")Routes"

routes_file_path="${feature_dir}/routes.jsx"

{
  printf 'import { %s } from "./pages/%s";\n' "${page_component}" "${page_component}"
  printf '\n'
  printf 'export const %s = {\n' "${routes_const_name}"
  if [[ -z "${route_path_relative}" ]]; then
    printf '  index: true,\n'
  else
    printf '  path: "%s",\n' "${route_path_relative}"
  fi
  printf '  element: <%s />,\n' "${page_component}"
  printf '};\n'
} > "${routes_file_path}"

cat > "${index_file}" <<EOF_INDEX
export { ${page_component} } from "./pages/${page_component}";
export { ${routes_const_name} } from "./routes";
EOF_INDEX

import_line="import { ${routes_const_name} } from \"@/features/${feature_key}\";"
route_identifier="${routes_const_name}"

ROUTES_FILE="${routes_file}" IMPORT_LINE="${import_line}" python3 <<'PY'
import os
import sys

file_path = os.environ["ROUTES_FILE"]
import_line = os.environ["IMPORT_LINE"]

with open(file_path, "r", encoding="utf-8") as handle:
    lines = handle.readlines()

if any(line.strip() == import_line for line in lines):
    sys.exit(0)

last_import_index = -1
for idx, line in enumerate(lines):
    if line.startswith("import "):
        last_import_index = idx

insert_index = last_import_index + 1 if last_import_index != -1 else 0
while insert_index < len(lines) and lines[insert_index].strip() == "":
    insert_index += 1

lines.insert(insert_index, import_line + "\n")

with open(file_path, "w", encoding="utf-8") as handle:
    handle.writelines(lines)
PY

ROUTES_FILE="${routes_file}" LAYOUT_NAME="${selected_layout}" ROUTE_IDENTIFIER="${route_identifier}" python3 <<'PY'
import os
import sys

file_path = os.environ["ROUTES_FILE"]
layout_name = os.environ["LAYOUT_NAME"]
route_identifier = os.environ["ROUTE_IDENTIFIER"]

with open(file_path, "r", encoding="utf-8") as handle:
    content = handle.read()

layout_marker = f"element: <{layout_name} />"
layout_index = content.find(layout_marker)
if layout_index == -1:
    sys.stderr.write(f"Could not find layout {layout_name} in routes file.\n")
    sys.exit(1)

children_index = content.find("children", layout_index)
if children_index == -1:
    sys.stderr.write(f"Could not find children array for layout {layout_name}.\n")
    sys.exit(1)

bracket_start = content.find("[", children_index)
if bracket_start == -1:
    sys.stderr.write(f"Could not locate opening bracket for layout {layout_name} children.\n")
    sys.exit(1)

depth = 0
close_index = -1
for idx in range(bracket_start, len(content)):
    char = content[idx]
    if char == "[":
        depth += 1
    elif char == "]":
        depth -= 1
        if depth == 0:
            close_index = idx
            break

if close_index == -1:
    sys.stderr.write(f"Could not find closing bracket for layout {layout_name} children.\n")
    sys.exit(1)

before = content[:close_index]
after = content[close_index:]
line_start = content.rfind("\n", 0, bracket_start)
line_start = 0 if line_start == -1 else line_start + 1
indent = content[line_start:bracket_start]
child_indent = indent + "  "

children_block = content[bracket_start:close_index]
if route_identifier in children_block:
    sys.exit(0)

entry = child_indent + route_identifier.strip() + ",\n"

content = before + entry + after

with open(file_path, "w", encoding="utf-8") as handle:
    handle.write(content)
PY

echo
printf '✅ Feature scaffold created successfully.\n'
printf '  • Feature directory: %s\n' "${feature_dir#${root_dir}/}"
printf '  • Page component: %s\n' "${page_component}"
printf '  • Route registered at: %s (layout: %s)\n' "${route_path}" "${selected_layout}"
