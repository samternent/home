kubectl -n backend apply -f - <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: ternent-api-ledger
type: Opaque
stringData:
  LEDGER_S3_ENDPOINT: "https://lon1.digitaloceanspaces.com"
  LEDGER_BUCKET: "pixpax"
  LEDGER_PREFIX: "pixpax/ledger"
  LEDGER_ACCESS_KEY_ID: "SECRET"
  LEDGER_SECRET_ACCESS_KEY: "SECRET"
  LEDGER_REGION: "lon1"
  LEDGER_FLUSH_MAX_EVENTS: "200"
  LEDGER_FLUSH_INTERVAL_MS: "60000"
  LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON: '[{"keyId":"c0dc4717e29075d28b29283cd9b3bb5ae5dc21daa1dfbb966a4008b5cf110010","publicKeyPem":"-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQC5HKUs3D92b8TREctod+ngMYVMI\nOv8b/U4Gfaqm92XvGwSi2lThg74fZqGXA9qftS4W7MpxanpXG0meJsV8hw==\n-----END PUBLIC KEY-----\n"}]'
EOF
