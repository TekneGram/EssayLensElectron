# Feature Spec: RubricTab (Layout)

## Purpose
Define the high-level layout behavior for `RubricTab`, which displays two rubric-related views side by side:
- `RubricSelectionView`
- `RubricView`

This spec is layout-focused only. Data retrieval, persistence, and rubric domain behavior are specified separately.

## Scope
- In scope:
  - Two-panel `RubricTab` composition
  - Desktop and responsive layout behavior
  - Basic panel visibility and ordering
  - Accessibility baseline for panel regions
- Out of scope:
  - Database reads/writes
  - Rubric domain logic (selection, editing, grading internals)
  - Internal behavior of `RubricSelectionView` and `RubricView`

## Dependency / Non-Conflict Note
- `features/02_assessment_window_tabs_spec.md` owns switching between `AssessmentTab` and `RubricTab`.
- This spec applies only when `RubricTab` is already active.
- No overlap with `AssessmentTab` internal layout (`features/03_assessment-tab.md`).

## Component Split

### Presentational
- `RubricTab`: two-panel layout shell.
- Left panel: `RubricSelectionView`.
- Right panel: `RubricView`.

### Data/Control
- `RubricTabContainer` (or parent rubric controller) provides view props and callbacks.
- Optional hook: `useRubricTabLayout` for responsive layout state if needed.

## Layout Contract

### `RubricTab` reads
- `selectionPanel: ReactNode`
- `rubricPanel: ReactNode`
- optional layout props:
  - `isCompact?: boolean`
  - `splitRatio?: string` (example default: `35/65`)

### `RubricTab` writes
- none (domain)

### `RubricTab` emits
- none required for baseline layout
- optional UI-only events if resizable/collapsible behavior is introduced later

## Behavior Rules
1. When `RubricTab` is active, both `RubricSelectionView` and `RubricView` are rendered.
2. On desktop/wide layout, panels are displayed side by side.
3. On narrow layout, panels stack vertically in this order:
   1. `RubricSelectionView`
   2. `RubricView`
4. `RubricView` is the primary working area and should receive larger width on desktop.
5. `RubricTab` does not fetch data directly.

## Accessibility Baseline
- Each panel is a labeled region (heading or `aria-label`).
- Focus order follows visual order (selection panel then rubric panel).
- Layout changes do not remove keyboard access to either panel.

## State Ownership Matrix

| State | Owner | Consumers | Notes |
|---|---|---|---|
| `activeTopTab` (`assessment` \| `rubric`) | `AssessmentWindowContainer` | `AssessmentWindow`, tab panels | External dependency; not owned by `RubricTab`. |
| `rubricTabLocalUI` (layout-only flags) | `RubricTabContainer` | `RubricTab` | Optional, only if layout behavior needs local state. |
| `rubricSelectionState` | Rubric feature controller/service | `RubricSelectionView`, `RubricView` | Domain state deferred to rubric-specific specs. |
| `rubricDocumentState` | Rubric feature controller/service | `RubricView` | Domain state deferred to rubric-specific specs. |

## Acceptance Criteria
- With `RubricTab` active, both panels are visible.
- Wide viewport shows side-by-side layout.
- Narrow viewport shows stacked layout in specified order.
- `RubricTab` contains no direct data-fetching or persistence logic.

## Suggested Folder Layout Addition

```txt
src/
  features/
    rubric-tab/
      RubricTabContainer.tsx
      components/
        RubricTab.tsx
        RubricSelectionView.tsx
        RubricView.tsx
      hooks/
        useRubricTabLayout.ts
      types.ts
```

## Notes
- Keep `RubricTab` presentational and driven by props.
- Add rubric data contracts in lower-level specs for `RubricSelectionView` and `RubricView`.
