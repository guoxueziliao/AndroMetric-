# utils/ - Data Processing Utilities

**Parent:** ../AGENTS.md

---

## OVERVIEW

12 utility modules for data transformation, migrations, validation, and shared analysis helpers.

---

## WHERE TO LOOK

| Task | Module | Notes |
|------|--------|-------|
| Database migration | `migration.ts` | Schema upgrades, data transformations |
| Data validation | `validators.ts`, `tagValidators.ts` | Input validation rules |
| Data repair | `historyRepair.ts` | Fix corrupted history entries |
| Hydrate records | `hydrateLog.ts` | Enrich partial log entries |
| Regression analysis | `regression.ts` | Linear regression for trends |
| Recommendations | `recommendationEngine.ts` | Personalized suggestions |
| Helpers | `helpers.ts` | Date formatting, calculations |
| Alcohol helpers | `alcoholHelpers.ts` | BAC calculations |
| Health check | `dataHealthCheck.ts` | Data integrity validation |
| Constants | `constants.ts` | Shared constants |

---

## CONVENTIONS

- **Pure functions:** No side effects in utility functions
- **Immutability:** Return new objects, never mutate inputs
- **Type exports:** Export types alongside functions
- **Date handling:** Use ISO strings,生理日 logic in helpers

---

## ANTI-PATTERNS

- **NEVER** import React in utils (pure TypeScript only)
- **NEVER** access `window` or DOM APIs
- **NEVER** import from `components/` (circular dependency risk)
- **AVOID** large switch statements - use object maps instead

---

## MIGRATION SYSTEM

```typescript
// migration.ts pattern
export async function runMigrations(db: HardnessDiaryDatabase): Promise<void> {
  // Check current version
  // Apply sequential upgrades
  // Always backup before destructive changes
}
```

**Critical:** Every schema change needs migration. Data loss = user trust loss.

---

## STATS ENGINE

Stats-specific engines, XP radar logic, insights, and event normalization live in `features/stats/model`.

---

## NOTES

- **Regression:** Simple linear regression for trend lines
- **Recommendations:** Rule-based engine analyzing patterns
- **Validators:** Both sync and async validation patterns
- **No external deps:** Pure TypeScript + browser APIs only
