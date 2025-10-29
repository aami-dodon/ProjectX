#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
else
    echo "❌ .env file not found at $ENV_FILE"
    exit 1
fi

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

DEMO_TENANT_MARKER="demo-users-seed"
DEMO_PASSWORD_HASH='$2b$12$ARqaoXVJVQXstRxDfLtw5O5xpgyBmVdcGwGRU0mLOgfntMylJgTh6'
DEMO_DATA_FILE="$SCRIPT_DIR/demo-users.csv"
MIN_COUNT=100
DEFAULT_COUNT=$MIN_COUNT
ACTION="load"
COUNT="$DEFAULT_COUNT"

usage() {
    cat <<USAGE
Usage: $(basename "$0") [--load|--delete] [--count <number>]

Options:
  --load           Insert demo users listed in $DEMO_DATA_FILE (default action).
  --delete         Remove previously inserted demo users.
  --count <number> Number of demo users to insert when using --load (default/minimum: $DEFAULT_COUNT).
  -h, --help       Show this help text.

All demo users are tagged with tenant_id "$DEMO_TENANT_MARKER" and share the password "DemoPass123!".
Records are sourced from $DEMO_DATA_FILE (CSV with email,full_name columns).
USAGE
}

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

run_psql() {
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
}

get_demo_count() {
    run_psql -At -c "SELECT COUNT(*) FROM auth_users WHERE tenant_id = '$DEMO_TENANT_MARKER';"
}

load_demo_users() {
    local desired_count="$1"
    local before_count after_count inserted sql_buffer uuid email full_name dataset available_count

    mapfile -t dataset < <(tail -n +2 "$DEMO_DATA_FILE" | sed -e '/^\s*#/d' -e '/^\s*$/d')
    available_count="${#dataset[@]}"

    if [[ "$available_count" -lt "$desired_count" ]]; then
        echo "❌ Requested $desired_count demo users but only $available_count records exist in $DEMO_DATA_FILE"
        exit 1
    fi

    before_count="$(get_demo_count)"

    sql_buffer=$'BEGIN;'
    for ((i = 0; i < desired_count; i++)); do
        IFS=',' read -r email full_name <<<"${dataset[$i]}"
        email="$(echo "$email" | xargs)"
        full_name="$(echo "$full_name" | xargs)"
        uuid="$(uuidgen)"
        sql_buffer+=$'\n'
        sql_buffer+=$(cat <<SQL
INSERT INTO auth_users (
    id,
    email,
    password_hash,
    full_name,
    tenant_id,
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
    '$DEMO_TENANT_MARKER',
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

    run_psql -q <<SQL
$sql_buffer
SQL

    after_count="$(get_demo_count)"
    inserted=$((after_count - before_count))

    echo "✅ Requested $desired_count demo users; $inserted new users added (tenant_id=$DEMO_TENANT_MARKER)."
    echo "ℹ️  Each demo user uses the password: DemoPass123!"
    echo "ℹ️  User records sourced from $DEMO_DATA_FILE."
}

delete_demo_users() {
    local deleted_count
    deleted_count="$(run_psql -At <<SQL
WITH deleted AS (
    DELETE FROM auth_users WHERE tenant_id = '$DEMO_TENANT_MARKER' RETURNING 1
)
SELECT COUNT(*) FROM deleted;
SQL
)"

    if [[ -z "$deleted_count" ]]; then
        deleted_count=0
    fi

    echo "🧹 Removed $deleted_count demo users tagged with tenant_id=$DEMO_TENANT_MARKER."
}

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
