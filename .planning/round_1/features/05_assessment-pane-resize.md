# Feature Spec: AssessmentTab Pane Resize/Collapse (UI)

## Purpose
Define UI-only interaction for resizing, collapsing, and reopening vertical panes in `AssessmentTab`.

This spec covers pane mechanics only and does not define document/comment/rubric domain behavior.

## Scope
- In scope:
  - Drag-to-resize with vertical dividers
  - 2-pane and 3-pane layout resizing
  - Collapse at threshold and click-to-reopen handles
  - Keyboard-accessible separators
  - Optional local persistence of layout state
- Out of scope:
  - File parsing
  - Comments or scoring logic
  - Data fetching/persistence beyond optional local UI preference storage

## Dependency / Non-Conflict Note
- Complements `features/03_assessment-tab.md` (layout composition).
- `features/03_assessment-tab.md` owns pane existence/mode selection.
- This spec owns only the interaction behavior of pane dividers/handles.

## Interaction Model

### Modes
- 2-pane mode:
  - `OriginalTextView | CommentsView`
  - one divider
- 3-pane mode:
  - `ImageView | OriginalTextView | CommentsView`
  - two dividers

### Drag Resize
1. User presses pointer on divider.
2. UI enters resize mode and tracks horizontal pointer movement.
3. Adjacent pane sizes are updated continuously.
4. Sizes are clamped by min bounds unless collapse threshold is crossed.
5. On pointer release, resize mode ends and final sizes are committed.

### Collapse / Reopen
1. If pane width falls below `collapseThresholdPct`, pane collapses (`size=0`).
2. Collapsed pane leaves a slim vertical reopen handle.
3. Clicking reopen handle restores pane to:
   - `lastOpenPct` if available, else
   - `minPct`.
4. Adjacent pane size is reduced to maintain total width.

## State Model (UI-only)

```ts
type PaneKey = 'image' | 'text' | 'comments';

type PaneLayoutState = {
  mode: 'two-pane' | 'three-pane';
  sizesPct: Record<PaneKey, number>; // sums to 100 for visible panes
  minPct: Record<PaneKey, number>;
  collapsed: Record<PaneKey, boolean>;
  lastOpenPct: Partial<Record<PaneKey, number>>;
};
```

## Defaults (recommended)
- 2-pane initial:
  - `text: 65`, `comments: 35`
- 3-pane initial:
  - `image: 20`, `text: 50`, `comments: 30`
- `minPct`:
  - `image: 15`, `text: 30`, `comments: 20`
- `collapseThresholdPct`:
  - `8`

## Accessibility Baseline
- Divider element:
  - `role="separator"`
  - `aria-orientation="vertical"`
  - `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Keyboard support:
  - Left/Right arrows adjust divider by step (example: 2%)
  - Shift + arrows for larger step (example: 5%)
- Collapsed handle:
  - focusable button
  - `Enter`/`Space` reopens pane

## Performance Guidelines
- Use pointer events (`pointerdown/move/up`).
- Apply size updates via `requestAnimationFrame` during drag.
- Disable text selection while dragging.
- Keep drag hit target easy to grab (visual line + wider invisible hit area).

## State Ownership Matrix

| State | Owner | Consumers | Notes |
|---|---|---|---|
| `paneLayoutState` | `AssessmentTabContainer` / `useAssessmentTabLayout` | `AssessmentTab` panes/dividers | UI-only local state. |
| `selectedFileType` | Shared app/workspace controller | `AssessmentTabContainer` | Determines 2-pane vs 3-pane mode. |
| `isResizing` | `useAssessmentTabLayout` | Divider components | Transient interaction state only. |
| `layoutPreference` (optional) | Local storage adapter in UI layer | `useAssessmentTabLayout` | Optional persistence; not domain data. |

## Acceptance Criteria
- User can resize panes horizontally by dragging dividers.
- In 2-pane mode, one divider resizes text/comments panes.
- In 3-pane mode, two dividers resize adjacent panes.
- Crossing collapse threshold collapses the target pane.
- Collapsed pane can be reopened by clicking its vertical handle.
- Reopen restores `lastOpenPct` (or `minPct` if unavailable).
- Layout remains keyboard accessible via separators/handles.

## Suggested Folder Layout Addition

```txt
src/
  features/
    assessment-tab/
      hooks/
        useAssessmentTabLayout.ts
        __tests__/
          useAssessmentTabLayout.resize.test.ts
      components/
        AssessmentPaneDivider.tsx
        AssessmentCollapsedHandle.tsx
        __tests__/
          AssessmentPaneDivider.test.tsx
          AssessmentCollapsedHandle.test.tsx
      utils/
        paneLayoutMath.ts
        __tests__/
          paneLayoutMath.test.ts
tests/
  integration/
    assessment-pane-resize.integration.test.tsx
```

## Notes
- Keep this behavior independent from comment/text/rubric domain state.
- If persistence is added, store only UI layout preferences.
