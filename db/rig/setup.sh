#!/usr/bin/env bash
# Storm Tracker Postgres test rig (build-spec §5.1).
# Creates a throwaway database, applies shim -> migrations -> grants -> seed.
#
# Requirements: a local Postgres 16+ superuser connection.
#   RIG_SUPERUSER_URL  connection string with rights to drop/create databases
#                      (default tries the local `postgres` peer user via sudo)
#   RIG_DB             test database name (default storm_tracker_test)
set -euo pipefail

RIG_DB="${RIG_DB:-storm_tracker_test}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/prisma/migrations"
RIG_DIR="$REPO_ROOT/db/rig"
SEED_FILE="$REPO_ROOT/db/seed/dsm5-bipolar.sql"

# psql runner: RIG_SUPERUSER_URL if provided, else local peer auth as postgres.
run_psql() {
  local db="$1"; shift
  if [[ -n "${RIG_SUPERUSER_URL:-}" ]]; then
    local base="${RIG_SUPERUSER_URL%/*}"
    psql "$base/$db" -v ON_ERROR_STOP=1 -q "$@"
  elif [[ "$(id -un)" == "postgres" ]]; then
    psql -d "$db" -v ON_ERROR_STOP=1 -q "$@"
  else
    sudo -u postgres psql -d "$db" -v ON_ERROR_STOP=1 -q "$@"
  fi
}

echo "rig: recreating database $RIG_DB"
run_psql postgres -c "DROP DATABASE IF EXISTS $RIG_DB;"
run_psql postgres -c "CREATE DATABASE $RIG_DB;"

echo "rig: applying auth shim"
run_psql "$RIG_DB" -f "$RIG_DIR/shim.sql"

echo "rig: applying migrations"
for dir in "$MIGRATIONS_DIR"/*/; do
  name="$(basename "$dir")"
  echo "  - $name"
  if [[ "$name" == "20260407_analysis_tables_and_triggers" ]]; then
    # This committed migration contains a compute_predictions() body that cannot
    # compile (dead `v_transitions RECORD[]` declaration — F23; fixed live on prod
    # 2026-04-07 but never committed). Apply without body validation, then overlay
    # the rig compat port below.
    run_psql "$RIG_DB" -c "SET check_function_bodies = off;" -f "$dir/migration.sql"
  else
    run_psql "$RIG_DB" -f "$dir/migration.sql"
  fi
done

echo "rig: applying compat overlay (F23 — see db/rig/compat/)"
run_psql "$RIG_DB" -f "$RIG_DIR/compat/compute_predictions.sql"

echo "rig: applying data-api grants (ST-004 mirror)"
run_psql "$RIG_DB" -f "$RIG_DIR/grants.sql"

echo "rig: seeding dsm5-bipolar framework"
run_psql "$RIG_DB" -f "$SEED_FILE"

# Login role for the vitest suite (test-only credentials, local rig database).
echo "rig: ensuring rig login role"
run_psql postgres -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rig') THEN
    CREATE ROLE rig LOGIN PASSWORD 'rig' SUPERUSER;
  END IF;
END \$\$;"

echo "rig: ready — postgres://rig:rig@127.0.0.1:5432/$RIG_DB"
