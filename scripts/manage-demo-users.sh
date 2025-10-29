#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

# --- Load only DATABASE_URL from .env ---
if [[ -f "$ENV_FILE" ]]; then
    echo "🔹 Reading DATABASE_URL from $ENV_FILE"
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed -E 's/^DATABASE_URL=//')"
    if [[ -z "$DATABASE_URL" ]]; then
        echo "❌ DATABASE_URL not found in $ENV_FILE"
        exit 1
    fi
    export DATABASE_URL
else
    echo "❌ .env file not found at $ENV_FILE"
    exit 1
fi

# --- Validate required tools ---
if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "❌ DATABASE_URL is not set in $ENV_FILE"
    exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
    echo "❌ psql command not found. Please install the PostgreSQL client tools."
    exit 1
fi

if ! command -v uuidgen >/dev/null 2>&1; then
    echo "❌ uuidgen command not found. Please install the uuid-runtime package."
    exit 1
fi

# --- Configuration ---
DEMO_PASSWORD_HASH='$2b$12$ARqaoXVJVQXstRxDfLtw5O5xpgyBmVdcGwGRU0mLOgfntMylJgTh6'
DEMO_DATA_FILE="$SCRIPT_DIR/demo-users.csv"
MIN_COUNT=100
DEFAULT_COUNT=$MIN_COUNT
ACTION="load"
COUNT="$DEFAULT_COUNT"

# --- Usage help ---
usage() {
    cat <<USAGE
Usage: $(basename "$0") [--load|--delete] [--count <number>]

Options:
  --load           Insert demo users listed in $DEMO_DATA_FILE (default action).
  --delete         Remove previously inserted demo users.
  --count <number> Number of demo users to insert when using --load (default/minimum: $DEFAULT_COUNT).
  -h, --help       Show this help text.

All demo users share the password "DemoPass123!".
Records are sourced from $DEMO_DATA_FILE (CSV with email,full_name columns).
USAGE
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --load)
            ACTION="load"
            shift
            ;;
        --delete)
            ACTION="delete"
            shift
            ;;
        --count)
            if [[ $# -lt 2 ]]; then
                echo "❌ Missing value for --count"
                exit 1
            fi
            COUNT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

if [[ "$ACTION" == "delete" && "$COUNT" != "$DEFAULT_COUNT" ]]; then
    echo "⚠️  --count is ignored when using --delete"
fi

if [[ ! -f "$DEMO_DATA_FILE" ]]; then
    echo "❌ Demo user data file not found at $DEMO_DATA_FILE"
    exit 1
fi

if [[ "$ACTION" == "load" ]]; then
    if ! [[ "$COUNT" =~ ^[0-9]+$ ]]; then
        echo "❌ --count must be a positive integer"
        exit 1
    fi

    if [[ "$COUNT" -lt "$MIN_COUNT" ]]; then
        echo "❌ --count must be at least $MIN_COUNT to ensure adequate demo coverage"
        exit 1
    fi
fi

# --- Helper functions ---
run_psql() {
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
}

sql_escape() {
    local value="$1"
    printf "%s" "${value//\'/''}"
}

build_email_array_literal() {
    local emails=("$@")
    if [[ ${#emails[@]} -eq 0 ]]; then
        printf "ARRAY[]::text[]"
        return
    fi

    local quoted=()
    local email
    for email in "${emails[@]}"; do
        quoted+=("'$(sql_escape "$email")'")
    done

    printf "ARRAY[%s]" "$(IFS=,; echo "${quoted[*]}")"
}

get_demo_count_for_emails() {
    local emails=("$@")
    if [[ ${#emails[@]} -eq 0 ]]; then
        echo "0"
        return
    fi

    local email_array
    email_array=$(build_email_array_literal "${emails[@]}")

    run_psql -At <<SQL
SELECT COUNT(*) FROM auth_users WHERE email = ANY($email_array);
SQL
}

load_demo_users() {
    local desired_count="$1"
    local before_count after_count inserted sql_buffer uuid email full_name available_count
    local dataset=()

    # --- Cross-platform CSV reading (macOS & Linux) ---
    if command -v mapfile >/dev/null 2>&1; then
        # Linux / Bash >= 4
        mapfile -t dataset < <(tail -n +2 "$DEMO_DATA_FILE" | sed -e '/^\s*#/d' -e '/^\s*$/d')
    else
        # macOS fallback
        while IFS= read -r line; do
            [[ "$line" =~ ^\s*# ]] && continue
            [[ "$line" =~ ^\s*$ ]] && continue
            dataset+=("$line")
        done < <(tail -n +2 "$DEMO_DATA_FILE")
    fi

    available_count="${#dataset[@]}"

    if [[ "$available_count" -lt "$desired_count" ]]; then
        echo "❌ Requested $desired_count demo users but only $available_count records exist in $DEMO_DATA_FILE"
        exit 1
    fi

    local emails=()
    local email

    sql_buffer=$'BEGIN;'
    for ((i = 0; i < desired_count; i++)); do
        IFS=',' read -r email full_name <<<"${dataset[$i]}"
        email="$(echo "$email" | xargs)"
        full_name="$(echo "$full_name" | xargs)"
        uuid="$(uuidgen)"
        emails+=("$email")
        sql_buffer+=$'\n'
        sql_buffer+=$(cat <<SQL
INSERT INTO auth_users (
    id,
    email,
    password_hash,
    full_name,
    status,
    email_verified_at,
    mfa_enabled,
    created_at,
    updated_at
) VALUES (
    '$uuid',
    '$email',
    '$DEMO_PASSWORD_HASH',
    '$full_name',
    'ACTIVE',
    NOW(),
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
SQL
)
    done
    sql_buffer+=$'\nCOMMIT;'

    before_count="$(get_demo_count_for_emails "${emails[@]}")"

    run_psql -q <<SQL
$sql_buffer
SQL

    after_count="$(get_demo_count_for_emails "${emails[@]}")"
    inserted=$((after_count - before_count))

    echo "✅ Requested $desired_count demo users; $inserted new users added."
    echo "ℹ️  Each demo user uses the password: DemoPass123!"
    echo "ℹ️  User records sourced from $DEMO_DATA_FILE."
}

delete_demo_users() {
    local dataset=()
    local emails=()
    local deleted_count email entry

    if command -v mapfile >/dev/null 2>&1; then
        mapfile -t dataset < <(tail -n +2 "$DEMO_DATA_FILE" | sed -e '/^\s*#/d' -e '/^\s*$/d')
    else
        while IFS= read -r line; do
            [[ "$line" =~ ^\s*# ]] && continue
            [[ "$line" =~ ^\s*$ ]] && continue
            dataset+=("$line")
        done < <(tail -n +2 "$DEMO_DATA_FILE")
    fi

    if [[ ${#dataset[@]} -eq 0 ]]; then
        echo "ℹ️  No demo user records found in $DEMO_DATA_FILE."
        return
    fi

    for entry in "${dataset[@]}"; do
        IFS=',' read -r email _ <<<"$entry"
        email="$(echo "$email" | xargs)"
        [[ -z "$email" ]] && continue
        emails+=("$email")
    done

    if [[ ${#emails[@]} -eq 0 ]]; then
        echo "ℹ️  No valid demo user emails found in $DEMO_DATA_FILE."
        return
    fi

    local email_array
    email_array=$(build_email_array_literal "${emails[@]}")

    deleted_count="$(run_psql -At <<SQL
WITH deleted AS (
    DELETE FROM auth_users WHERE email = ANY($email_array) RETURNING 1
)
SELECT COUNT(*) FROM deleted;
SQL
)"

    if [[ -z "$deleted_count" ]]; then
        deleted_count=0
    fi

    echo "🧹 Removed $deleted_count demo users sourced from $DEMO_DATA_FILE."
}

# --- Main execution ---
case "$ACTION" in
    load)
        load_demo_users "$COUNT"
        ;;
    delete)
        delete_demo_users
        ;;
    *)
        echo "❌ Unsupported action: $ACTION"
        exit 1
        ;;
esac
