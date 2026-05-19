# Hardness Diary

Hardness Diary is a privacy-first, local-first PWA for tracking male health signals and related lifestyle factors. It stores data in IndexedDB via Dexie, runs offline, and focuses on turning fragmented daily inputs into timelines, trends, and practical self-observation.

## What It Does

- Tracks morning wood, sleep, mood, stress, exercise, alcohol, caffeine, sex, and masturbation logs
- Organizes records around a physiological day, where entries before `03:00` belong to the previous day
- Shows dashboard summaries, calendar heatmaps, timelines, and statistical views
- Supports partner profiles, tag management, backup/version history, and PWA install/update prompts
- Keeps data on-device by default with JSON export and local recovery workflows

## Stack

- React 18
- TypeScript with `strict: true`
- Vite
- Dexie + IndexedDB
- vite-plugin-pwa
- Chart.js
- Framer Motion
- Vitest

## Project Structure

```text
.
├── app/                 # App shell, providers, main view router, bootstrap
├── features/            # Domain features (dashboard, daily-log, sex-life,
│                        # stats, tags, backup, settings, pwa, profile,
│                        # reproductive, simulation-lab, state, quick-actions)
├── shared/              # shared/ui primitives, shared/lib pure helpers
├── core/                # core/storage: Dexie, repositories, migrations,
│                        # backup-handle persistence
├── domain/              # domain/types (LogEntry etc.) + domain/rules
├── services/            # Backup, file system, logger, plugin manager
├── hooks/               # Cross-cutting React hooks (useLogs facade)
├── contexts/            # Narrow contexts: LogQueryContext, PartnerContext,
│                        # ReproductiveContext (plus ToastContext)
├── utils/               # Mixed legacy utils awaiting further migration
├── tests/               # Vitest coverage for core flows and model logic
├── docs/architecture.md # Architecture rationale and migration history
├── db.ts                # Re-export shim → core/storage/db
└── types.ts             # Re-export shim → domain/types
```

## Core Areas

- `features/dashboard`: home views, calendar heatmap, global timeline, log history
- `features/daily-log`: main daily form and lifestyle record modals
- `features/sex-life`: partner management, sex records, masturbation records
- `features/stats`: charts, scoring, insights, derived analysis
- `features/state`: personal-state engine + Analysis Hub
- `features/backup`: local backup settings and version history
- `features/pwa`: install prompt, update prompt, offline UI

## Development

Requirements:

- Node.js `24` from `.nvmrc`

Install and run:

```bash
npm install
npm run dev
```

Build, test, and typecheck:

```bash
npm run build
npm run test
npm run typecheck
```

## Engineering Notes

- Build output is generated into `dist/` and is not treated as source.
- The app is local-first; there is no cloud sync, no backend.
- Database schema changes must be paired with a migration step in
  [`core/storage/migration.ts`](core/storage/migration.ts).
- New components belong inside a `features/<domain>/` module or in
  `shared/ui` — there is no top-level `components/` directory.

## Documentation

- Architecture notes: [`docs/architecture.md`](docs/architecture.md)
- Agent guidance for contributors: [`AGENTS.md`](AGENTS.md)
