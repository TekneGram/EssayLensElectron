# Feature Spec: AssessmentTab (Layout)

## Purpose
Define the high-level layout and visibility rules inside `AssessmentTab`:
- `ImageView`
- `OriginalTextView`
- `CommentsView`

This spec is intentionally layout-focused. Detailed behavior for nested components is deferred to lower-level feature specs.

## Scope
- In scope:
  - Region composition in `AssessmentTab`
  - `ImageView` collapsed/open visibility rule
  - File-type routing to `ImageView` vs `OriginalTextView`
  - `CommentsView` presence and internal tab shell expectations
  - Multi-pane layout modes (2-pane and 3-pane)
- Out of scope:
  - Comment creation/editing logic
  - Text parsing/rendering details for `.docx` / `.pdf`
  - Score calculation logic
  - Rubric logic (covered by `RubricTab` specs)
  - Detailed resize/collapse interaction model (covered by `features/05_assessment-pane-resize.md`)

## Dependency / Non-Conflict Note
- `features/02_assessment_window_tabs_spec.md` defines switching between `AssessmentTab` and `RubricTab`.
- This spec starts only after `AssessmentTab` is active and visible.
- No overlap in tab-state ownership at `AssessmentWindow` level.

## Component Split

### Presentational
- `AssessmentTab`: layout shell for the three regions.
- `ImageView`: image panel (collapsed by default).
- `OriginalTextView`: text document display panel.
- `CommentsView`: comments panel container with internal tab UI.

### Data/Control
- `AssessmentTabContainer` (or feature controller) owns file-type state and passes view model props.
- Optional hook: `useAssessmentTabLayout` for visibility and routing logic.

## Layout Contract

### `AssessmentTab` reads
- `selectedFileType: 'image' | 'docx' | 'pdf' | 'other' | null`
- `imageSrc?: string`
- `documentTextModel?: unknown`
- `commentsViewModel?: unknown`
- `activeCommentsTab: 'comments' | 'score'`

### `AssessmentTab` writes
- none (domain)

### `AssessmentTab` emits
- `onCommentsTabChange(next: 'comments' | 'score')`
- optional callbacks for nested presentational controls

## State Ownership Matrix

| State | Owner | Consumers | Notes |
|---|---|---|---|
| `selectedFileId` / `selectedFileType` | Shared app/workspace controller (not `AssessmentTabContainer`) | `AssessmentTabContainer`, `OriginalTextView`, `ImageView` | Read-only from AssessmentTab perspective. |
| `isImageViewOpen` (derived) | `AssessmentTabContainer` | `AssessmentTab`, `ImageView` | Derived from `selectedFileType === 'image'`; default collapsed otherwise. |
| `documentTextModel` | Document/text feature controller/service | `AssessmentTabContainer`, `OriginalTextView` | AssessmentTab renders only; does not fetch. |
| `activeCommentsTab` (`comments` \| `score`) | `AssessmentTabContainer` | `CommentsView`, `CommentView`, `ScoreTool` | Local AssessmentTab UI state. |
| `commentDraft` / comment form local state | `CommentsView` subtree (local UI) | `CommentView` | Ephemeral UI state; not domain state ownership. |
| `paneLayoutState` (`sizes`, `collapsed`, `mode`) | `AssessmentTabContainer` / `useAssessmentTabLayout` | `AssessmentTab` panes + dividers | UI-only layout state; no domain ownership. |

## Behavior Rules
1. `ImageView` is collapsed by default.
2. `ImageView` opens only when the selected file type is `image`.
3. For `.docx` and `.pdf`, content is shown in `OriginalTextView` (`TextViewWindow` region).
4. `CommentsView` is always present while `AssessmentTab` is active.
5. `CommentsView` contains two internal tab panels:
   - `CommentView`
   - `ScoreTool`
6. Only one `CommentsView` internal panel is visible at a time.
7. `AssessmentTab` does not directly fetch data or perform persistence.
8. `AssessmentTab` supports:
   - 2-pane mode: `OriginalTextView` + `CommentsView`
   - 3-pane mode: `ImageView` + `OriginalTextView` + `CommentsView` (when image file is selected)
9. Pane resizing and collapse/reopen behavior is specified in `features/05_assessment-pane-resize.md`.

## Accessibility Baseline
- Internal comments tabs should use:
  - `role="tablist"` for tab group
  - `role="tab"` with `aria-selected`
  - `role="tabpanel"` for active panel

## Acceptance Criteria
- When no image is selected, `ImageView` is collapsed.
- Selecting an image file opens `ImageView`.
- Selecting a `.docx` or `.pdf` displays text content in `OriginalTextView`.
- `CommentsView` remains visible while switching file types.
- `CommentsView` tab switch shows only one panel (`CommentView` or `ScoreTool`) at a time.
- Pane structure switches correctly between 2-pane and 3-pane modes based on selected file type.

## Suggested Folder Layout Addition

```txt
src/
  features/
    assessment-tab/
      AssessmentTabContainer.tsx
      hooks/
        useAssessmentTabLayout.ts
      components/
        AssessmentTab.tsx
        ImageView.tsx
        OriginalTextView.tsx
        TextViewWindow.tsx
        ProcessCommandCenter.tsx
        CommentsView.tsx
        CommentView.tsx
        ScoreTool.tsx
      types.ts
```

## Notes
- Keep `AssessmentTab` presentational and driven by props.
- Route file-type behavior in container/hook, not inside presentational components.
