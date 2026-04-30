# components/ - Legacy Notes

**Parent:** ../AGENTS.md

---

## OVERVIEW

No runtime React components remain in this directory. Keep this file only as a routing note for old paths and future cleanup.

---

## WHERE TO LOOK

| Task | Component | Notes |
|------|-----------|-------|
| Shared modal/control | `../shared/ui/*` | Modal, Toast, selectors, form controls, error boundary |
| App shell | `../app/*` | Welcome screen, bottom navigation, providers, routing |
| Dashboard history | `../features/dashboard/*` | Log history and diff rows |
| PWA install/update UI | `../features/pwa/*` | Install prompt, update prompt, install button |
| Disabled analysis placeholders | `../features/analysis/*` | AI and analysis placeholders |
| Daily record modals | `../features/daily-log/*Modal.tsx` | Caffeine, exercise, alcohol, and nap record forms |
| Sex life records | `../features/sex-life/*` | Partner manager, sex modal, masturbation modal |

---

## CONVENTIONS

- Do not add new runtime components here.
- Put new UI into the owning feature or `shared/ui`.
- If an old import points to `components/*`, route it to the mapped destination above.

---

## ANTI-PATTERNS

- **NEVER** inline large objects in JSX - define outside component
- **NEVER** use `useMemo` for trivial computations
- **AVOID** prop drilling >2 levels - use Context
- **AVOID** inline function definitions in render - use `useCallback`

---

## LARGE COMPONENTS

No large sex-life forms remain in `components/`; those business components now live in `features/sex-life`.

---

## NOTES

- **Dashboard:** Home view, calendar heatmap, global timeline, and log history live in `features/dashboard`
- **App shell:** Welcome screen and bottom navigation live in `app`
- **Desktop sidebar:** `SidebarNav` lives in `app`
- **Analysis placeholders:** disabled AI/analysis placeholders live in `features/analysis`
- **Daily log:** Main record form, morning/sleep/health sections, and lifestyle record modals live in `features/daily-log`
- **Quick actions:** Floating action button and quick record controller live in `features/quick-actions`
- **PWA UI:** Install prompt, update prompt, and install button live in `features/pwa`
- **Sex life:** Timeline view, partner manager, sex modal, and masturbation modal live in `features/sex-life`
- **Stats:** Stats view and hardness chart live in `features/stats`
- **Shared UI:** Modal, Toast, DateTimePicker, NoticeSystem, form controls, selectors, and ErrorBoundary live in `shared/ui`
- **Lazy imports:** App shell lazy-loads StatsView, SexLifeView, and `features/profile/MyView`
- **Suspense:** Wrap lazy views with `<Suspense fallback={LoadingFallback}>`
- **Legacy scope:** Keep new business components out of `components/`; prefer the owning feature module.
