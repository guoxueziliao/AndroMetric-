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
├── app/                 # App shell, routing, bootstrap, providers
├── features/            # Domain features such as dashboard, daily log, stats, PWA
├── shared/              # Shared UI primitives and pure helpers
├── core/                # Infrastructure and storage adapters
├── domain/              # Domain-facing exports and rules
├── services/            # Backup, logging, storage, plugin management
├── hooks/               # Cross-cutting React hooks
├── contexts/            # Data and toast contexts
├── tests/               # Vitest coverage for core flows and model logic
├── docs/architecture.md # Ongoing architecture/refactor notes
├── db.ts                # Dexie schema
└── types.ts             # Main TypeScript data model
```

## Core Areas

- `features/dashboard`: home views, calendar heatmap, global timeline, log history
- `features/daily-log`: main daily form and lifestyle record modals
- `features/sex-life`: partner management, sex records, masturbation records
- `features/stats`: charts, scoring, insights, derived analysis
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

Build and test:

```bash
npm run build
npm run test
```

## Engineering Notes

- Build output is generated into `dist/` and is not treated as source
- The app is local-first; there is no cloud sync in the current architecture
- Database schema changes must be paired with migration updates in [`utils/migration.ts`](utils/migration.ts)
- Large feature work should prefer the current `app/ + features/ + shared/` structure over reviving legacy `components/`

## Documentation

- Architecture notes: [`docs/architecture.md`](docs/architecture.md)
- Agent guidance for contributors: [`AGENTS.md`](AGENTS.md)
