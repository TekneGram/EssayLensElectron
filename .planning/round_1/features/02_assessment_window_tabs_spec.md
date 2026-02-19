# AssessmentWindow Tabs (Lightweight Spec)

## Purpose
Define the UI behavior for `AssessmentWindow` tab switching between:
- `AssessmentTab`
- `RubricTab`

This is a layout and interaction spec only. Feature-specific behavior for each tab is defined in their own specs.

## Scope
- In scope:
  - Tab header UI (`Assessment`, `Rubric`)
  - Active tab state and switching behavior
  - Conditional rendering of tab panels
  - Basic accessibility semantics
- Out of scope:
  - Internal logic of `AssessmentTab` or `RubricTab`
  - Data fetching and persistence details

## Component Contract

### Presentational: `AssessmentWindow`
- Reads:
  - `activeTab: 'assessment' | 'rubric'`
  - panel content props/slots
- Writes:
  - none (domain)
- Emits:
  - `onTabChange(nextTab: 'assessment' | 'rubric')`

### Control: `AssessmentWindowContainer` (or parent controller)
- Owns `activeTab` state.
- Handles `onTabChange`.
- Passes active state and callbacks to presentational tab UI.

## State Ownership Matrix

| State | Owner | Consumers | Notes |
|---|---|---|---|
| `activeTopTab` (`assessment` \| `rubric`) | `AssessmentWindowContainer` | `AssessmentWindow`, tab panels | Single source of truth for top-level tab switching. |
| `selectedFileId` / `selectedFileType` | Shared app/workspace controller (outside `AssessmentTabContainer`) | `AssessmentWindowContainer`, `AssessmentTabContainer`, `RubricTab` container (if needed) | Keep shared selection outside tab-local containers. |
| `assessmentTabLocalUI` (including pane widths/collapse flags) | `AssessmentTabContainer` | `AssessmentTab` subtree | Internal-only UI state for Assessment tab. |
| `rubricTabLocalUI` | `RubricTab` container | `RubricTab` subtree | Internal-only UI state for Rubric tab. |

## Behavior Rules
1. Default active tab is `assessment`.
2. Clicking `Assessment` shows `AssessmentTab` and hides `RubricTab`.
3. Clicking `Rubric` shows `RubricTab` and hides `AssessmentTab`.
4. Only one tab panel is visible at a time.
5. Active tab has clear visual state (selected style).
6. Tab state remains stable during normal re-renders.
7. `AssessmentTab` local layout state (pane widths/collapse) is preserved when switching tabs in the same session.

## Accessibility Baseline
- Tab list container uses `role="tablist"`.
- Tab buttons use `role="tab"` and `aria-selected`.
- Panels use `role="tabpanel"` and are associated to tabs.
- Keyboard navigation (recommended baseline):
  - Left/Right arrows move focus between tabs.
  - Enter/Space activates focused tab.

## Acceptance Criteria
- App starts with `Assessment` tab visible.
- Clicking each tab switches to the correct panel.
- Inactive panel is not visible.
- Active tab visual state updates correctly.
- `aria-selected` reflects active tab.

## Suggested Folder Layout Addition

```txt
src/
  features/
    assessment-window/
      AssessmentWindowContainer.tsx
      __tests__/
        AssessmentWindowContainer.test.tsx
      components/
        AssessmentWindow.tsx
        AssessmentWindowTabs.tsx
        __tests__/
          AssessmentWindow.test.tsx
          AssessmentWindowTabs.test.tsx
      hooks/
        useAssessmentWindowTabs.ts
        __tests__/
          useAssessmentWindowTabs.test.ts
      types.ts
tests/
  integration/
    assessment-window-tabs.integration.test.tsx
```

## Notes
- Keep `AssessmentWindow` presentational.
- Keep tab state orchestration in container/hook so this remains consistent with the app-wide presentational/data-control split.
