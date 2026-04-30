# 硬度日记 (Hardness Diary) - Project Knowledge Base

**Generated:** 2026-04-11
**Version:** 0.0.7
**Stack:** React + TypeScript + Vite PWA + Dexie (IndexedDB)

---

## OVERVIEW

Privacy-first male health tracking PWA. Local-first architecture using Dexie.js for offline storage. Features: morning wood tracking, sex life logging, lifestyle correlation analysis, partner profiles, XP radar charts.

---

## STRUCTURE

```
./
├── components/          # Legacy notes only; no runtime components
├── app/                 # App composition and top-level routing
├── features/            # Business-domain feature modules
├── shared/              # Shared UI and pure helpers
├── core/                # Storage and infrastructure adapters
├── domain/              # Domain types and rules
├── utils/              # Data processing, stats, migrations
├── services/           # Storage, logging, plugin system
├── hooks/              # React hooks (useLogs, useLocalStorage)
├── contexts/           # DataContext, ToastContext
├── plugins/            # Analysis plugins
├── types.ts            # All TypeScript definitions
├── db.ts               # Dexie database schema
└── App.tsx             # Main app component
```

---

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new record type | `types.ts` → `LogEntry` interface | All data structures defined here |
| Database migration | `utils/migration.ts` | Add version upgrade logic |
| New daily modal/form | `features/daily-log/*Modal.tsx` | Copy existing record modal pattern |
| Shared UI primitive | `shared/ui/*` | Modal, Toast, selectors, form controls, error boundary |
| App shell | `app/*` | Providers, welcome screen, bottom navigation, main view routing |
| Disabled analysis placeholders | `features/analysis/*` | AI/analysis placeholders kept out of active UI |
| Daily log form | `features/daily-log/*` | Main record form, morning/sleep/health sections, lifestyle modals |
| Stats/analytics | `features/stats/*` | Stats view, charts, XP radar, factor analysis |
| UI state management | `hooks/useLogs.ts` | Main data hook |
| Dashboard/home | `features/dashboard/*` | Home view, calendar heatmap, timeline, log history |
| Quick actions | `features/quick-actions/*` | FAB, quick record controller, ongoing selectors |
| PWA install/update UI | `features/pwa/*` | Install prompt, update prompt, install button |
| Tag management | `features/tags/*` | Tag manager and tag health check |
| Backup/version history | `features/backup/*` | Local backup settings and version history modal |
| Theme settings | `features/settings/*` | Theme UI and theme hook |
| Sex life view | `features/sex-life/*` | Sex timeline, partner manager, sex and masturbation modals |
| Partner management | `features/sex-life/PartnerManager.tsx` | 761 lines, complex form |
| Sex/Masturbation records | `features/sex-life/SexRecordModal.tsx`, `features/sex-life/MasturbationRecordModal.tsx` | Large modals |

---

## CONVENTIONS

- **Date Logic:** Physiological day - records before 03:00 belong to previous calendar day
- **Naming:** PascalCase for components, camelCase for functions
- **Strict TS:** `strict: true`, no `any`, unused vars/parameters error
- **Module:** ESNext with `allowImportingTsExtensions: true`
- **Tailwind:** Brand colors: `brand-bg`, `brand-text`, `brand-accent`, `brand-muted`

---

## ANTI-PATTERNS

- **NEVER** use `any` - TypeScript strict mode enforces this
- **NEVER** suppress `noUnusedLocals` - clean up unused variables
- **NEVER** modify `db.ts` schema without adding migration in `utils/migration.ts`
- **NEVER** store sensitive data unencrypted - Local-first only
- **AVOID** inline styles - use Tailwind classes
- **AVOID** prop drilling - use DataContext for shared state

---

## UNIQUE STYLES

- **Privacy Mode:** `settings.privacyMode` triggers `blur-md grayscale opacity-50` on app container
- **Lazy Loading:** Heavy views (StatsView, SexLifeView, `features/profile/MyView`) use React.lazy()
- **Plugin System:** `services/PluginManager.ts` - register analysis plugins
- **Version History:** Automatic snapshots before major operations
- **Quick Actions:** `features/quick-actions/FAB.tsx` provides the floating action button for instant recording

---

## COMMANDS

```bash
npm install
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## NOTES

- **Local-First:** All data in IndexedDB. No cloud sync. Manual JSON export for backup.
- **PWA:** Service worker auto-updates. Offline functionality via vite-plugin-pwa.
- **Dexie:** Currently at version 5. Add migrations for schema changes.
- **Tailwind:** Loaded via CDN in index.html, cached by service worker.
- **Large Components:** `features/sex-life/SexRecordModal.tsx` (880 lines), `features/sex-life/PartnerManager.tsx` (761 lines), `features/sex-life/MasturbationRecordModal.tsx` (701 lines); `features/daily-log/LogForm.tsx` remains large and should be split before adding major features.
