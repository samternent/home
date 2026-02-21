#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

DEFAULT_DEV_ENV_FILE="$SCRIPT_DIR/.env.local"

usage() {
  cat <<'EOF'
Usage:
  .ops/ternent-api/db-access.sh <command> <env> [options]

Commands:
  url <dev|prod> [--direct] [--port <n>]
      Print a DB URL. For cluster URLs, default output rewrites host to 127.0.0.1:<port>.
      Use --direct to print the original URL unchanged.

  tunnel <dev|prod> [--port <n>]
      Start kubectl port-forward for the environment.

  psql <dev|prod> [--direct] [--port <n>]
      Open psql against the selected environment.

  migrate <dev|prod> [--direct] [--port <n>]
      Run platform migrations against the selected environment URL.

Examples:
  .ops/ternent-api/db-access.sh url dev
  .ops/ternent-api/db-access.sh tunnel prod --port 15432
  .ops/ternent-api/db-access.sh psql prod --port 15432
  .ops/ternent-api/db-access.sh migrate dev

Environment overrides:
  DB_DEV_URL
  DB_PROD_URL

  DB_DEV_ENV_FILE (default: .ops/ternent-api/.env.local)

  DB_DEV_K8S_CONTEXT
  DB_DEV_K8S_NAMESPACE (default: backend)
  DB_DEV_K8S_SERVICE (default: ternent-postgres)
  DB_DEV_K8S_SECRET (default: ternent-api-auth)
  DB_DEV_K8S_SECRET_KEY (default: database-url)

  DB_PROD_K8S_CONTEXT
  DB_PROD_K8S_NAMESPACE (default: backend)
  DB_PROD_K8S_SERVICE (default: ternent-postgres)
  DB_PROD_K8S_SECRET (default: ternent-api-auth)
  DB_PROD_K8S_SECRET_KEY (default: database-url)
EOF
}

require_bin() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "missing required command: $name" >&2
    exit 1
  fi
}

parse_flag_value() {
  local flag="$1"
  shift
  local found=""
  while [[ "$#" -gt 0 ]]; do
    if [[ "$1" == "$flag" ]]; then
      if [[ "${2:-}" == "" ]]; then
        echo "missing value for $flag" >&2
        exit 1
      fi
      found="$2"
      break
    fi
    shift
  done
  printf '%s' "$found"
}

has_flag() {
  local flag="$1"
  shift
  while [[ "$#" -gt 0 ]]; do
    if [[ "$1" == "$flag" ]]; then
      return 0
    fi
    shift
  done
  return 1
}

kubectl_ctx_args() {
  local context="$1"
  if [[ -n "$context" ]]; then
    printf -- '--context=%s' "$context"
    return
  fi
  printf ''
}

fetch_secret_db_url() {
  local context="$1"
  local namespace="$2"
  local secret="$3"
  local key="$4"

  require_bin kubectl

  local ctx
  ctx="$(kubectl_ctx_args "$context")"
  if [[ -n "$ctx" ]]; then
    kubectl "$ctx" -n "$namespace" get secret "$secret" -o "go-template={{index .data \"$key\" | base64decode}}"
    return
  fi
  kubectl -n "$namespace" get secret "$secret" -o "go-template={{index .data \"$key\" | base64decode}}"
}

read_env_file_db_url() {
  local env_file="$1"
  if [[ ! -f "$env_file" ]]; then
    return 1
  fi
  local line
  line="$(grep -E '^DATABASE_URL=' "$env_file" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi
  line="${line#DATABASE_URL=}"
  line="${line%\"}"
  line="${line#\"}"
  printf '%s' "$line"
}

resolve_db_url() {
  local target_env="$1"

  if [[ "$target_env" == "dev" ]]; then
    if [[ -n "${DB_DEV_URL:-}" ]]; then
      printf '%s' "$DB_DEV_URL"
      return
    fi

    local env_file="${DB_DEV_ENV_FILE:-$DEFAULT_DEV_ENV_FILE}"
    local from_file=""
    from_file="$(read_env_file_db_url "$env_file" || true)"
    if [[ -n "$from_file" ]]; then
      printf '%s' "$from_file"
      return
    fi

    local context="${DB_DEV_K8S_CONTEXT:-}"
    local namespace="${DB_DEV_K8S_NAMESPACE:-backend}"
    local secret="${DB_DEV_K8S_SECRET:-ternent-api-auth}"
    local key="${DB_DEV_K8S_SECRET_KEY:-database-url}"
    fetch_secret_db_url "$context" "$namespace" "$secret" "$key"
    return
  fi

  if [[ "$target_env" == "prod" ]]; then
    if [[ -n "${DB_PROD_URL:-}" ]]; then
      printf '%s' "$DB_PROD_URL"
      return
    fi

    local context="${DB_PROD_K8S_CONTEXT:-}"
    local namespace="${DB_PROD_K8S_NAMESPACE:-backend}"
    local secret="${DB_PROD_K8S_SECRET:-ternent-api-auth}"
    local key="${DB_PROD_K8S_SECRET_KEY:-database-url}"
    fetch_secret_db_url "$context" "$namespace" "$secret" "$key"
    return
  fi

  echo "unsupported env '$target_env' (expected dev or prod)" >&2
  exit 1
}

env_k8s_context() {
  local target_env="$1"
  if [[ "$target_env" == "prod" ]]; then
    printf '%s' "${DB_PROD_K8S_CONTEXT:-}"
    return
  fi
  printf '%s' "${DB_DEV_K8S_CONTEXT:-}"
}

env_k8s_namespace() {
  local target_env="$1"
  if [[ "$target_env" == "prod" ]]; then
    printf '%s' "${DB_PROD_K8S_NAMESPACE:-backend}"
    return
  fi
  printf '%s' "${DB_DEV_K8S_NAMESPACE:-backend}"
}

env_k8s_service() {
  local target_env="$1"
  if [[ "$target_env" == "prod" ]]; then
    printf '%s' "${DB_PROD_K8S_SERVICE:-ternent-postgres}"
    return
  fi
  printf '%s' "${DB_DEV_K8S_SERVICE:-ternent-postgres}"
}

rewrite_db_url_for_localhost() {
  local db_url="$1"
  local local_port="$2"
  require_bin node
  node -e '
    const raw = process.argv[1];
    const port = String(process.argv[2] || "15432");
    const u = new URL(raw);
    u.hostname = "127.0.0.1";
    u.port = port;
    console.log(u.toString());
  ' "$db_url" "$local_port"
}

main() {
  if [[ $# -lt 2 ]]; then
    usage
    exit 1
  fi

  local command="$1"
  local target_env="$2"
  shift 2

  if [[ "$target_env" != "dev" && "$target_env" != "prod" ]]; then
    echo "env must be 'dev' or 'prod'" >&2
    exit 1
  fi

  local local_port
  local_port="$(parse_flag_value --port "$@" || true)"
  if [[ -z "$local_port" ]]; then
    if [[ "$target_env" == "prod" ]]; then
      local_port="15432"
    else
      local_port="15433"
    fi
  fi

  local direct="false"
  if has_flag --direct "$@"; then
    direct="true"
  fi

  case "$command" in
    url)
      local db_url
      db_url="$(resolve_db_url "$target_env")"
      if [[ "$direct" == "true" ]]; then
        printf '%s\n' "$db_url"
        return
      fi
      rewrite_db_url_for_localhost "$db_url" "$local_port"
      ;;
    tunnel)
      require_bin kubectl
      local context
      local namespace
      local service
      context="$(env_k8s_context "$target_env")"
      namespace="$(env_k8s_namespace "$target_env")"
      service="$(env_k8s_service "$target_env")"
      echo "Starting tunnel: $target_env -> $namespace/service/$service on 127.0.0.1:$local_port"
      local ctx
      ctx="$(kubectl_ctx_args "$context")"
      if [[ -n "$ctx" ]]; then
        kubectl "$ctx" -n "$namespace" port-forward "service/$service" "$local_port:5432"
        return
      fi
      kubectl -n "$namespace" port-forward "service/$service" "$local_port:5432"
      ;;
    psql)
      require_bin psql
      local psql_url
      if [[ "$direct" == "true" ]]; then
        psql_url="$(resolve_db_url "$target_env")"
      else
        psql_url="$(rewrite_db_url_for_localhost "$(resolve_db_url "$target_env")" "$local_port")"
      fi
      PGAPPNAME="ternent-${target_env}-manual-psql" psql "$psql_url"
      ;;
    migrate)
      local migrate_url
      if [[ "$direct" == "true" ]]; then
        migrate_url="$(resolve_db_url "$target_env")"
      else
        migrate_url="$(rewrite_db_url_for_localhost "$(resolve_db_url "$target_env")" "$local_port")"
      fi
      (
        cd "$REPO_ROOT"
        DATABASE_URL="$migrate_url" pnpm --filter ternent-api platform:migrate
      )
      ;;
    *)
      echo "unknown command: $command" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
