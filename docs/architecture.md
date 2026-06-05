# Architecture

> Current baseline after 0.2.22. Older migration logs and knife-by-knife status notes have been removed; if this document conflicts with code, verify code first and update this file.

## Project Shape

Hardness Diary is a privacy-first, local-first PWA. Data stays in IndexedDB through Dexie; there is no backend or cloud sync.

Current stack:

- React 18 + TypeScript strict
- Vite + vite-plugin-pwa
- Dexie / IndexedDB
- Chart.js, Framer Motion, Vitest
- Tailwind built locally through `index.css`, `tailwind.config.ts`, and PostCSS

## Layers

Dependency direction is top to bottom only:

```text
app -> features -> shared/ui, core/storage -> shared/lib, domain
```

- `app/`: application composition, providers, routing, navigation, bootstrap hooks, editor wiring.
- `features/`: user-facing business modules such as dashboard, daily-log, sex-life, stats, profile, quick-actions, tags, backup, reproductive, pwa, state, simulation-lab.
- `shared/ui/`: presentational primitives that receive data and callbacks through props.
- `shared/lib/`: pure helpers with no React, Dexie, DOM, window, or localStorage dependency.
- `core/storage/`: Dexie instance, storage service, migrations, import/export helpers, snapshots, backup handles, storage estimate utilities.
- `domain/`: stable types and business rules with no React, Dexie, DOM, window, or localStorage dependency.

## Current Structure

```text
.
├── app/
├── contexts/
├── core/storage/
├── domain/
│   ├── rules/
│   └── types/
├── features/
│   ├── backup/
│   ├── daily-log/
│   ├── dashboard/
│   ├── profile/
│   ├── pwa/
│   ├── quick-actions/
│   ├── reproductive/
│   ├── sex-life/
│   ├── simulation-lab/
│   ├── state/
│   ├── stats/
│   └── tags/
├── shared/
│   ├── lib/
│   └── ui/
├── hooks/
├── services/
├── utils/
└── tests/
```

There is no top-level `components/` directory. Do not recreate it.

Root compatibility shims that still exist:

- `types.ts` re-exports from `domain/types`.
- `db.ts` re-exports from `core/storage/db`.
- `services/StorageService.ts` re-exports from `core/storage/StorageService`.
- `utils/migration.ts` re-exports from `core/storage/migration`.

## Data Wiring

`app/AppProviders.tsx` runs the main `useLogs()` facade once and passes data into `app/AppContent.tsx`. App composition then feeds feature modules through explicit props or narrow contexts.

Current narrow contexts:

- `LogQueryContext`: log query state.
- `PartnerContext`: partner list and CRUD.
- `ReproductiveContext`: cycle and pregnancy events plus CRUD.
- `ToastContext`: toast notifications.

Do not add broad global facades for convenience. Add a narrow context only when a real caller needs it.

## Write Flow

Writes should follow this path:

```text
UI event -> feature hook/controller -> use case/service -> core/storage -> Dexie
```

Rules:

- UI expresses intent only.
- Feature use cases own business rules, target-date resolution, defaults, and `changeHistory`.
- `core/storage` owns persistence, transactions, snapshots, import/export, and Dexie access.
- New components must not import `db`, Dexie tables, or `StorageService.logs.*` directly.

## Read Flow

Reads should follow this path:

```text
Dexie live query -> query hook/facade -> selector/view model -> UI
```

Rules:

- Query hooks return raw or hydrated records.
- Selectors/view models own derived display data.
- Complex derived business values should have one authoritative implementation.

## Domain Rules

Preserve these invariants:

- Physiological day: entries before `03:00` belong to the previous calendar day.
- `hydrateLog` keeps partial log defaults stable.
- `changeHistory` is appended by use cases, not by UI components.
- Adult-health and health-insight surfaces must avoid diagnosis, moral judgment, addiction labeling, and strong causal claims.

## Storage And Migrations

Dexie database:

- Name: `HardnessDiaryDB`
- Current Dexie schema version: `9`
- Current data migration version: `LATEST_VERSION = 50`

Current tables:

- `logs`
- `partners`
- `cycle_events`
- `pregnancy_events`
- `meta`
- `system_logs`
- `snapshots`
- `tags`
- `porn_use_events`
- `masturbation_events`
- `sex_events`
- `training_goals`
- `goal_checkins`
- `health_projects`
- `health_project_plans`
- `health_project_logs`

Any schema change in `core/storage/db.ts` must be paired with a migration step in `core/storage/migration.ts`. Do not rename user-visible fields or exported JSON field names just for refactoring.

## UI And Tokens

`index.css` is the source of truth for semantic CSS variables. `tailwind.config.ts` maps those variables to Tailwind utilities.

Use semantic utilities such as:

- `bg-surface-base`
- `bg-surface-card`
- `text-text-primary`
- `text-text-muted`
- `bg-accent`
- `text-text-on-accent`
- `state-*`
- `chart-*`

Do not reintroduce `brand-*`, `pastel-*`, `palette-*`, or `styles/theme.css`.

## Feature Boundaries

- Other modules should import a feature through its public `index.ts`.
- Avoid deep-importing another feature's internal `model/`, `ui/`, or helper files.
- Shared UI must not know about `LogEntry`, Dexie, storage services, or app-specific contexts.
- Domain code must not contain UI text, Tailwind classes, React code, or browser API usage.

## Validation

Before closing implementation work, run the relevant subset of:

```bash
npm run typecheck
npm run test
npm run build
npm run lint
git diff --check -- .
```

Expected current lint posture: zero errors; existing warnings may remain unless the task explicitly targets lint cleanup.
