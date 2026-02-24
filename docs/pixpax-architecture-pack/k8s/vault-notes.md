# Vault on DO Kubernetes (Transit signing) — Notes

Recommended install path:
- Use the official HashiCorp Vault Helm chart.
- Enable **integrated storage (Raft)** for simplicity.
- Enable **Kubernetes auth** and **Transit engine**.

You will need:
- A `pixpax-api` Vault policy that allows `transit/sign/<key>` for the identity keys it is permitted to use.
- Audit logging enabled (file/syslog).
- NetworkPolicy to restrict access to Vault only from the API namespace.

(Concrete values are environment-specific; treat this as a starter checklist.)
