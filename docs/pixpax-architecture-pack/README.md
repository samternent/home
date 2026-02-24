# PixPax Architecture Pack

Generated: 2026-02-24

This zip contains a complete, contractor-implementable architecture package:
- Full specification
- Architectural review
- Design diagrams (PlantUML)
- Proposed API interface + OpenAPI skeleton
- Acceptance criteria
- Kubernetes deployment templates

## Contents
- `specs/SPEC-1.md` and `specs/SPEC-1.pdf`
- `reviews/ARCHITECTURE_REVIEW.md` and `reviews/ARCHITECTURE_REVIEW.pdf`
- `diagrams/*.puml` (open with PlantUML)
- `api/API_INTERFACE.md` and `api/API_INTERFACE.pdf`
- `api/openapi.yaml` (starter OpenAPI)
- `api/ENDPOINT_INVENTORY.md` (extracted from current code)
- `specs/ACCEPTANCE_CRITERIA.md` and `.pdf`
- `k8s/` (api deployment, ingress, projector job, vault notes)

## How to render diagrams
Use PlantUML:
- VS Code PlantUML extension, or
- `plantuml diagrams/*.puml`

## Next recommended step
Implement Phase 1 (stability/security patch) on the current codebase, then begin Phase 2 modular extraction.
