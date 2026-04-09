# components/ - UI Components

**Parent:** ../AGENTS.md

---

## OVERVIEW

36 React components for forms, modals, charts, and views. Heavy usage of controlled inputs, React Context, and Tailwind styling.

---

## WHERE TO LOOK

| Task | Component | Notes |
|------|-----------|-------|
| Add new modal | Copy `Modal.tsx` pattern | Use `isOpen`, `onClose`, `title` props |
| Form with validation | Reference `LogForm.tsx` | 661 lines, comprehensive example |
| Calendar heatmap | `CalendarHeatmap.tsx` | Uses date-fns patterns |
| Partner management | `PartnerManager.tsx` | 761 lines, CRUD operations |
| Sex record entry | `SexRecordModal.tsx` | 880 lines, multi-step form |
| Dashboard charts | `HardnessChart.tsx` | Chart.js integration |
| Toast notifications | `Toast.tsx` | Via ToastContext |
| Global timeline | `GlobalTimeline.tsx` | Timeline visualization |

---

## CONVENTIONS

- **Props interface:** Named `*Props` (e.g., `ModalProps`)
- **Forward refs:** Use `React.forwardRef` for form inputs
- **Event handlers:** Prefix with `handle*` (e.g., `handleSave`, `handleClose`)
- **Modal state:** `[isModalOpen, setIsModalOpen]` pattern
- **Form dirty tracking:** `isFormDirty` + `onDirtyStateChange` callback
- **Tailwind:** Brand colors over defaults (`brand-bg` not `bg-gray-100`)

---

## ANTI-PATTERNS

- **NEVER** inline large objects in JSX - define outside component
- **NEVER** use `useMemo` for trivial computations
- **AVOID** prop drilling >2 levels - use Context
- **AVOID** inline function definitions in render - use `useCallback`

---

## LARGE COMPONENTS

| File | Lines | Reason |
|------|-------|--------|
| SexRecordModal.tsx | 880 | Complex multi-partner flow |
| PartnerManager.tsx | 761 | Full CRUD + profile fields |
| MasturbationRecordModal.tsx | 701 | Detailed XP tracking |
| LogForm.tsx | 661 | Master form aggregating all sections |
| Dashboard.tsx | 624 | Main view with calendar + stats |

---

## NOTES

- **Lazy imports:** App.tsx lazy-loads StatsView, SexLifeView, MyView
- **Suspense:** Wrap lazy views with `<Suspense fallback={LoadingFallback}>`
- **Error Boundary:** `ErrorBoundary.tsx` wraps critical components
- **Quick actions:** FAB.tsx manages quick record entry flow
