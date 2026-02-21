#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
NAMESPACE="${NAMESPACE:-backend}"
WITH_POSTGRES="${WITH_POSTGRES:-false}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "env file not found: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

ensure_secret() {
  local ns="$1"
  local secret="$2"
  if ! kubectl -n "$ns" get secret "$secret" >/dev/null 2>&1; then
    kubectl -n "$ns" create secret generic "$secret" >/dev/null
  fi
}

patch_key() {
  local ns="$1"
  local secret="$2"
  local key="$3"
  local value="$4"

  if [[ -z "$value" ]]; then
    return 0
  fi

  ensure_secret "$ns" "$secret"

  local b64
  b64="$(printf '%s' "$value" | base64 | tr -d '\n')"
  kubectl -n "$ns" patch secret "$secret" --type merge -p "{\"data\":{\"$key\":\"$b64\"}}" >/dev/null
  echo "upserted $ns/$secret:$key"
}

require_env() {
  local name="$1"
  local value="${!name:-}"
  if [[ -z "$value" ]]; then
    echo "missing required env var: $name" >&2
    exit 1
  fi
}

# -----------------------------------------------------------------------------
# ternent-api auth secret (used by .ops/ternent-api/deployment.yaml)
# -----------------------------------------------------------------------------
require_env DATABASE_URL
require_env AUTH_SECRET

patch_key "$NAMESPACE" "ternent-api-auth" "database-url" "${DATABASE_URL:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "database-ssl" "${DATABASE_SSL:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "auth-secret" "${AUTH_SECRET:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "auth-trusted-origins" "${AUTH_TRUSTED_ORIGINS:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "auth-passkey-rp-id" "${AUTH_PASSKEY_RP_ID:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "auth-passkey-rp-name" "${AUTH_PASSKEY_RP_NAME:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "auth-passkey-origins" "${AUTH_PASSKEY_ORIGINS:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "auth-session-idle-seconds" "${AUTH_SESSION_IDLE_SECONDS:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "auth-session-rolling-seconds" "${AUTH_SESSION_ROLLING_SECONDS:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "resend-api-key" "${RESEND_API_KEY:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "resend-from" "${RESEND_FROM:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "resend-reply-to" "${RESEND_REPLY_TO:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "resend-api-base" "${RESEND_API_BASE:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "smtp-host" "${SMTP_HOST:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "smtp-port" "${SMTP_PORT:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "smtp-secure" "${SMTP_SECURE:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "smtp-user" "${SMTP_USER:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "smtp-pass" "${SMTP_PASS:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "smtp-from" "${SMTP_FROM:-}"
patch_key "$NAMESPACE" "ternent-api-auth" "cors-allow-origins" "${CORS_ALLOW_ORIGINS:-}"

echo "auth secret upsert complete"

# -----------------------------------------------------------------------------
# ternent-api runtime/env secret (issuer + pixpax signing keys)
# -----------------------------------------------------------------------------
patch_key "$NAMESPACE" "ternent-api-env" "digitalocean-token" "${DIGITALOCEAN_TOKEN:-}"
patch_key "$NAMESPACE" "ternent-api-env" "issuer-private-key-pem" "${ISSUER_PRIVATE_KEY_PEM:-}"
patch_key "$NAMESPACE" "ternent-api-env" "issuer-master-seed" "${ISSUER_MASTER_SEED:-}"
patch_key "$NAMESPACE" "ternent-api-env" "pix-pax-receipt-private-key-pem" "${PIX_PAX_RECEIPT_PRIVATE_KEY_PEM:-}"
patch_key "$NAMESPACE" "ternent-api-env" "pix-pax-receipt-public-key-pem" "${PIX_PAX_RECEIPT_PUBLIC_KEY_PEM:-}"
patch_key "$NAMESPACE" "ternent-api-env" "pix-pax-receipt-key-id" "${PIX_PAX_RECEIPT_KEY_ID:-}"

echo "runtime env secret upsert complete"

# -----------------------------------------------------------------------------
# pixpax content/admin secret
# -----------------------------------------------------------------------------
patch_key "$NAMESPACE" "ternent-api-pixpax-content" "pix-pax-override-code-secret" "${PIX_PAX_OVERRIDE_CODE_SECRET:-}"
patch_key "$NAMESPACE" "ternent-api-pixpax-content" "pix-pax-admin-token" "${PIX_PAX_ADMIN_TOKEN:-}"
patch_key "$NAMESPACE" "ternent-api-pixpax-content" "ledger-content-prefix" "${LEDGER_CONTENT_PREFIX:-}"
patch_key "$NAMESPACE" "ternent-api-pixpax-content" "ledger-content-bucket" "${LEDGER_CONTENT_BUCKET:-}"

echo "pixpax content secret upsert complete"

# -----------------------------------------------------------------------------
# Optional postgres + backup secrets for manifests under .ops/postgres/
# Enable with: WITH_POSTGRES=true
# -----------------------------------------------------------------------------
if [[ "$WITH_POSTGRES" == "true" ]]; then
  patch_key "$NAMESPACE" "ternent-postgres" "postgres-user" "${POSTGRES_USER:-ternent}"
  patch_key "$NAMESPACE" "ternent-postgres" "postgres-password" "${POSTGRES_PASSWORD:-}"
  patch_key "$NAMESPACE" "ternent-postgres" "postgres-db" "${POSTGRES_DB:-ternent}"

  local_aws_endpoint="${AWS_ENDPOINT:-${LEDGER_S3_ENDPOINT:-}}"
  local_aws_region="${AWS_REGION:-${LEDGER_REGION:-}}"
  local_aws_access_key_id="${AWS_ACCESS_KEY_ID:-${LEDGER_ACCESS_KEY_ID:-}}"
  local_aws_secret_access_key="${AWS_SECRET_ACCESS_KEY:-${LEDGER_SECRET_ACCESS_KEY:-}}"
  local_walg_s3_prefix="${WALG_S3_PREFIX:-}"
  if [[ -z "$local_walg_s3_prefix" && -n "${LEDGER_BUCKET:-}" ]]; then
    local_walg_s3_prefix="s3://${LEDGER_BUCKET}/postgres"
  fi

  patch_key "$NAMESPACE" "ternent-postgres-backup" "WALG_S3_PREFIX" "$local_walg_s3_prefix"
  patch_key "$NAMESPACE" "ternent-postgres-backup" "AWS_ENDPOINT" "$local_aws_endpoint"
  patch_key "$NAMESPACE" "ternent-postgres-backup" "AWS_REGION" "$local_aws_region"
  patch_key "$NAMESPACE" "ternent-postgres-backup" "AWS_ACCESS_KEY_ID" "$local_aws_access_key_id"
  patch_key "$NAMESPACE" "ternent-postgres-backup" "AWS_SECRET_ACCESS_KEY" "$local_aws_secret_access_key"
  patch_key "$NAMESPACE" "ternent-postgres-backup" "WALG_COMPRESSION_METHOD" "${WALG_COMPRESSION_METHOD:-brotli}"

  if kubectl get namespace backend-dr >/dev/null 2>&1; then
    patch_key "backend-dr" "ternent-postgres-backup" "WALG_S3_PREFIX" "$local_walg_s3_prefix"
    patch_key "backend-dr" "ternent-postgres-backup" "AWS_ENDPOINT" "$local_aws_endpoint"
    patch_key "backend-dr" "ternent-postgres-backup" "AWS_REGION" "$local_aws_region"
    patch_key "backend-dr" "ternent-postgres-backup" "AWS_ACCESS_KEY_ID" "$local_aws_access_key_id"
    patch_key "backend-dr" "ternent-postgres-backup" "AWS_SECRET_ACCESS_KEY" "$local_aws_secret_access_key"
    patch_key "backend-dr" "ternent-postgres-backup" "WALG_COMPRESSION_METHOD" "${WALG_COMPRESSION_METHOD:-brotli}"
  fi

  echo "postgres secret upsert complete"
fi

echo "all requested secret upserts complete"
