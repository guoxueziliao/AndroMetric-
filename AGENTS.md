# AGENTS.md

Canonical agent guide for this repository lives in [`CLAUDE.md`](./CLAUDE.md).
Treat it as the source of truth for project layout, conventions, build commands,
and what to avoid. The architecture rationale (why the layers exist) is in
[`docs/architecture.md`](./docs/architecture.md).

Quick orientation:

- Stack: React 18 + TypeScript (strict) + Vite + Dexie + vite-plugin-pwa.
  Node 24 (see `.nvmrc`). Privacy-first, local-first PWA — no backend.
- Layered structure: `app/` → `features/` → `shared/ui`, `core/storage` →
  `shared/lib`, `domain/`. Strict downward dependency direction.
- Build/test: `npm run dev`, `npm run build`, `npm run test`,
  `npm run typecheck`. All four pass on `main`.
- Schema changes in `core/storage/db.ts` must be paired with a migration step
  in `core/storage/migration.ts`. The physiological-day rule (events before
  03:00 belong to the previous day) is invariant.
