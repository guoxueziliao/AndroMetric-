# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hardness Diary (硬度日记) — a privacy-first, local-first PWA for tracking male health signals (morning wood, sleep, mood, exercise, alcohol/caffeine, sex, masturbation). All data lives in IndexedDB via Dexie; there is no cloud sync.

Stack: React 18 + TypeScript (strict) + Vite + Dexie + vite-plugin-pwa + Chart.js + Framer Motion + Vitest. Node `24` per `.nvmrc`.

## Commands

```bash
npm install
npm run dev          # Vite dev server (PWA enabled in dev — see vite.config.ts devOptions)
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run test         # Vitest single run
npm run test:watch   # Vitest watch mode
npx tsc --noEmit     # Typecheck (no dedicated script yet; architecture doc recommends adding `typecheck`)
```

Run a single test file or test:

```bash
npx vitest run tests/p3-models.test.ts
npx vitest run -t "test name pattern"
```

Vitest is configured in `vitest.config.ts`: `happy-dom` environment, globals on, setup in `tests/setup.ts`, only files under `tests/` are picked up, `@` alias maps to repo root.

## Architecture

The codebase is mid-refactor from a flat `components/`-based layout to a layered architecture. The active layout is documented in `docs/architecture.md` and is authoritative — prefer it over the legacy structure.

**Layers (strict dependency direction, top → bottom only):**

```
app  →  features  →  shared/ui, core/storage  →  shared/lib, domain
```

- `app/` — Application composition only: `AppProviders`, `AppContent`, `MainViewRouter`, `BottomNav`/`SidebarNav`, `Welcome`, bootstrap and editor hooks. No business logic, no Dexie queries, no statistics.
- `features/<domain>/` — Business modules (`dashboard`, `daily-log`, `quick-actions`, `sex-life`, `stats`, `tags`, `backup`, `settings`, `pwa`, `profile`, `reproductive`, `simulation-lab`, `state`). Each feature exposes a stable entry; other features must not deep-import its internals.
- `shared/ui/` — Pure presentational primitives (Modal, Toast, DateTimePicker, FormControls, HardnessSelector, SafeDeleteModal, ErrorBoundary, NoticeSystem, AnimatedButton/Page). Receives data via props only. Must NOT consume narrow contexts or `StorageService`.
- `shared/lib/` — Pure functions only. No React, no Dexie, no DOM. Includes the physiological-day target-date helpers (`getActivityTargetDate`, `getSleepTargetDate`).
- `core/storage/` — Dexie instance, repository layer, migrations, backup/file-system/logger services, backup-handle persistence. May depend on `domain`. No React, no UI strings.
- `domain/` — Core types and business rules (`LogEntry`, `MorningRecord`, tag types, physiological-day rule). No React, no Dexie, no DOM/window/localStorage.

**Data wiring:**

- `app/AppProviders.tsx` runs `useLogs()` once and exposes its result both as a render-prop `data` argument (used by prop-drilling features) and through three narrow contexts in `contexts/`:
  - `LogQueryContext` — `{ logs, isInitializing }`
  - `PartnerContext` — `partners` plus CRUD
  - `ReproductiveContext` — `cycleEvents` / `pregnancyEvents` plus CRUD
- Per-activity write logic lives in `features/quick-actions/model/useCases/{sex,masturbation,exercise,nap,alcohol,sleep}.ts` as plain async functions; `useLogs()` only owns the live queries, the error-wrapped storage writers, and the `useCallback` bindings that inject `saveLog`/`deleteLog` into the use cases.
- Phase-2 narrow contexts that the architecture doc names but that have no current consumer (LogCommand, QuickAction, Tag, Settings) are intentionally NOT built — add one when a real caller needs it, rather than ship dead infrastructure.

**Legacy paths that still exist and are being migrated:**

- `utils/helpers.ts` — slated to split into `shared/lib` (pure helpers) and `domain/rules` (business rules); currently still at the repo root.

**Moved into the new layered structure (root paths are now re-export shims):**

- `types.ts` → `domain/types/{log,sex,reproductive,partner,tags,settings,snapshot,events}.ts`. Root `types.ts` re-exports from `./domain/types`.
- `db.ts` → `core/storage/db.ts`. Root `db.ts` re-exports.
- `services/StorageService.ts` → `core/storage/StorageService.ts`. Root re-exports.
- `utils/migration.ts` → `core/storage/migration.ts`. Root re-exports.

The `components/` directory has been removed entirely; do NOT recreate it.

**Data flow contracts:**

- Writes: UI event → feature hook/controller → use case → repository → Dexie. UI expresses intent only; the use case owns business rules, target-date resolution, `changeHistory`, and defaulting.
- Reads: Dexie live query → query hook → selector/view-model → UI. Derived business values must have one authoritative implementation, not be recomputed in components.
- Only `core/storage` may touch `db`, Dexie tables, or `StorageService.logs.*` directly.

## Domain rules to preserve

- **Physiological day:** entries with timestamps before `03:00` belong to the previous calendar day. This rule lives in shared date helpers and is relied on across dashboard, stats, and quick-actions. Do not change it.
- **`hydrateLog`** (`utils/hydrateLog.ts`) enforces the default structure for partial log entries; its stability is part of the test surface.
- **`changeHistory`** entries are appended by use cases, not by UI components.

## Database schema and migrations

`db.ts` defines a Dexie database `HardnessDiaryDB` currently at **version 6** with tables: `logs`, `partners`, `cycle_events`, `pregnancy_events`, `meta`, `system_logs`, `snapshots`, `tags` (composite key `[name+category]`).

**Any schema change in `db.ts` must be paired with a migration step in `utils/migration.ts`.** The architecture doc forbids new migrations during the current refactor phase unless fixing data corruption. Never rename user-visible fields or exported JSON field names purely for refactoring.

## Build / bundling

`vite.config.ts` defines explicit manual chunks (`react-vendor`, `dexie-vendor`, `chart-vendor`, `motion-vendor`, `icon-vendor`, `markdown-vendor`, `vendor`). PWA is configured via `vite-plugin-pwa` with `registerType: 'autoUpdate'`; Tailwind is loaded via CDN from `index.html` and cached by the service worker (see workbox `runtimeCaching`).

Heavy views (`StatsView`, `SexLifeView`, `features/profile/MyView`) are loaded with `React.lazy()`; keep this when adding similarly large views.

## Conventions

- TypeScript `strict: true` plus `noUnusedLocals` / `noUnusedParameters` — both error. Do not introduce `any`; do not suppress these flags.
- Module config: `ESNext` with `allowImportingTsExtensions: true` (imports may include `.ts`/`.tsx`).
- Tailwind brand tokens: `brand-bg`, `brand-text`, `brand-accent`, `brand-muted`. Prefer Tailwind classes over inline styles.
- Privacy mode (`settings.privacyMode`) applies `blur-md grayscale opacity-50` to the app container — keep this hook intact for any new top-level layout work.

## Things to avoid

- Adding business logic to `App.tsx` (currently only composes `AppProviders` + `AppContent`).
- Importing `db`, Dexie tables, or `StorageService.logs.*` from new components.
- Calling `useData()` from `shared/ui` primitives.
- Importing React, Dexie, DOM, window, or localStorage from `domain/`.
- Deep-importing another feature's internal files; go through its `index.ts`.
- Mixing architecture-migration changes and product-feature changes in the same PR.
- Committing `dist/` output.

## Reference docs

- `docs/architecture.md` — full layered-architecture spec, migration phases, and file-by-file migration map (authoritative).
- `AGENTS.md` — older contributor cheat-sheet, useful for "where to find X" tables; some structure notes predate the current `app/ + features/ + shared/` layout.
- `utils/AGENTS.md` — utils-folder specifics, including the migration pattern.
- `README.md` — user-facing overview.
