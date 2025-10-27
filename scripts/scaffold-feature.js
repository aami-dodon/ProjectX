#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

function prompt(question, rl) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join("");
}

function toTitleCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function ensureDirectoryAbsent(dirPath) {
  if (fs.existsSync(dirPath)) {
    throw new Error(`Directory already exists: ${dirPath}`);
  }
}

function listLayouts(layoutsDir) {
  if (!fs.existsSync(layoutsDir)) {
    throw new Error(`Layouts directory not found at ${layoutsDir}`);
  }

  return fs
    .readdirSync(layoutsDir)
    .filter((file) => file.endsWith(".jsx") || file.endsWith(".js"))
    .map((file) => path.basename(file, path.extname(file)));
}

function insertImport(content, importLine) {
  if (content.includes(importLine)) {
    return content;
  }

  const lines = content.split("\n");
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("import ")) {
      insertIndex = i + 1;
      continue;
    }
    if (line.trim() === "") {
      break;
    }
  }

  lines.splice(insertIndex, 0, importLine);
  return lines.join("\n");
}

function addRouteToLayout(content, layoutName, routeLine) {
  const layoutMarker = `element: <${layoutName} />`;
  const layoutIndex = content.indexOf(layoutMarker);

  if (layoutIndex === -1) {
    throw new Error(`Could not find layout ${layoutName} in routes file.`);
  }

  const childrenIndex = content.indexOf("children", layoutIndex);
  if (childrenIndex === -1) {
    throw new Error(`Could not find children array for layout ${layoutName}.`);
  }

  const bracketStart = content.indexOf("[", childrenIndex);
  if (bracketStart === -1) {
    throw new Error(`Could not locate opening bracket for layout ${layoutName} children.`);
  }

  let depth = 0;
  let closeIndex = -1;
  for (let i = bracketStart; i < content.length; i += 1) {
    const char = content[i];
    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        closeIndex = i;
        break;
      }
    }
  }

  if (closeIndex === -1) {
    throw new Error(`Could not find closing bracket for layout ${layoutName} children.`);
  }

  const before = content.slice(0, closeIndex);
  const after = content.slice(closeIndex);

  const lineStart = before.lastIndexOf("\n", bracketStart) + 1;
  const indentMatch = content.slice(lineStart, bracketStart).match(/^[ \t]*/);
  const indent = indentMatch ? indentMatch[0] : "";
  const childIndent = `${indent}  `;

  return `${before}${childIndent}${routeLine}\n${after}`;
}

async function run() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const rootDir = path.resolve(__dirname, "..");
    const clientDir = path.join(rootDir, "client");
    const featuresDir = path.join(clientDir, "src", "features");
    const layoutsDir = path.join(clientDir, "src", "app", "layouts");
    const routesFilePath = path.join(clientDir, "src", "app", "routes.jsx");

    const layoutNames = listLayouts(layoutsDir);
    if (!layoutNames.length) {
      throw new Error("No layouts were found to attach the route.");
    }

    console.log("Available layouts:");
    layoutNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });

    const layoutAnswer = await prompt("Select a layout by number or name: ", rl);
    let layoutName = "";
    const numericChoice = Number.parseInt(layoutAnswer, 10);
    if (!Number.isNaN(numericChoice) && numericChoice >= 1 && numericChoice <= layoutNames.length) {
      layoutName = layoutNames[numericChoice - 1];
    } else {
      const directMatch = layoutNames.find((name) => name.toLowerCase() === layoutAnswer.toLowerCase());
      if (directMatch) {
        layoutName = directMatch;
      }
    }

    if (!layoutName) {
      throw new Error("A valid layout selection is required.");
    }

    const featureKeyAnswer = await prompt("Feature key (kebab-case, e.g. reports-insights): ", rl);
    const featureKey = featureKeyAnswer
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!featureKey) {
      throw new Error("Feature key cannot be empty.");
    }

    const defaultRoutePath = featureKey === "home" ? "/" : `/${featureKey}`;
    const routeAnswer = await prompt(`Route path (default "${defaultRoutePath}"): `, rl);
    let routePath = routeAnswer || defaultRoutePath;
    if (!routePath.startsWith("/")) {
      routePath = `/${routePath}`;
    }

    if (!/^\/[-a-z0-9/]*$/i.test(routePath)) {
      throw new Error("Route path may only contain letters, numbers, and dashes.");
    }

    const defaultPageComponent = `${toPascalCase(featureKey)}Page`;
    const pageComponentAnswer = await prompt(`Page component name (default "${defaultPageComponent}"): `, rl);
    const pageComponentName = pageComponentAnswer ? toPascalCase(pageComponentAnswer) : defaultPageComponent;
    if (!pageComponentName) {
      throw new Error("Page component name cannot be empty.");
    }

    const defaultTitle = toTitleCase(featureKey) || "New Feature";
    const pageTitleAnswer = await prompt(`Page title (default "${defaultTitle}"): `, rl);
    const pageTitle = pageTitleAnswer || defaultTitle;

    rl.close();

    const featureDir = path.join(featuresDir, featureKey);
    ensureDirectoryAbsent(featureDir);

    const pagesDir = path.join(featureDir, "pages");
    const componentsDir = path.join(featureDir, "components");

    fs.mkdirSync(pagesDir, { recursive: true });
    fs.mkdirSync(componentsDir, { recursive: true });

    const indexFilePath = path.join(featureDir, "index.js");
    const indexFileContent = `export { ${pageComponentName} } from "./pages/${pageComponentName}";\n`;
    fs.writeFileSync(indexFilePath, indexFileContent, "utf8");

    const pageFilePath = path.join(pagesDir, `${pageComponentName}.jsx`);
    const pageTemplate = `export function ${pageComponentName}() {\n  return (\n    <section className="flex flex-1 flex-col gap-6 p-4 lg:p-6">\n      <header className="space-y-2">\n        <h1 className="text-2xl font-semibold tracking-tight">${pageTitle}</h1>\n        <p className="text-sm text-muted-foreground">\n          Replace this copy with the implementation details for the ${pageTitle.toLowerCase()}.\n        </p>\n      </header>\n    </section>\n  );\n}\n`;
    fs.writeFileSync(pageFilePath, pageTemplate, "utf8");

    const gitkeepPath = path.join(componentsDir, ".gitkeep");
    fs.writeFileSync(gitkeepPath, "", "utf8");

    const routesContent = fs.readFileSync(routesFilePath, "utf8");

    if (routesContent.includes(`path: "${routePath}"`)) {
      throw new Error(`Route path ${routePath} is already defined in the router.`);
    }

    const importLine = `import { ${pageComponentName} } from "@/features/${featureKey}/pages/${pageComponentName}";`;
    let updatedRoutes = insertImport(routesContent, importLine);
    updatedRoutes = addRouteToLayout(updatedRoutes, layoutName, `{ path: "${routePath}", element: <${pageComponentName} /> },`);

    fs.writeFileSync(routesFilePath, `${updatedRoutes}\n`, "utf8");

    console.log("\n✅ Feature scaffold created successfully:");
    console.log(`  • Feature directory: ${path.relative(rootDir, featureDir)}`);
    console.log(`  • Page component: ${pageComponentName}`);
    console.log(`  • Route registered at: ${routePath} (layout: ${layoutName})`);
  } catch (error) {
    rl.close();
    console.error(`\n❌ ${error.message}`);
    process.exitCode = 1;
  }
}

run();
