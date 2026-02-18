# Layout Spec (UI Frame)

## Purpose
Define the canonical UI frame and region layout for EssayLens across top-level tab states, including current collapse/resize behavior.

## Scope
- In scope:
  - Global shell regions and placement
  - `AssessmentWindow` layout for `AssessmentTab` and `RubricTab`
  - `ChatView` collapse rail behavior
  - `AssessmentTab` pane split-resize behavior
  - Baseline sizing intent and responsive fallback
- Out of scope:
  - Backend/data workflows
  - Python service internals
  - Detailed visual token values (see `09_styles_spec.md`)

## Component Codes
- `LB` = `LoaderBar`
- `FDB` = `FileDisplayBar`
- `IV` = `ImageView`
- `OTV` = `OriginalTextView`
- `CV` = `CommentsView`
- `RSV` = `RubricSelectionView`
- `RV` = `RubricView`
- `CH` = `ChatView`
- `CHR` = collapsed chat rail
- `CI` = `ChatInterface`

## Canonical Layout Diagrams

### `AssessmentWindow` on `AssessmentTab` (image closed, resizable 2-pane)
```txt
-------------------------------------------------------------
|LB|FDB|------AssessmentWindow(AssessmentTab)------|--CH-----|
|LB|FDB|---------OTV---|split|---CV---------------|--CH-----|
-------------------------------------------------------------
|--------------------------CI--------------------------------|
-------------------------------------------------------------
```

### `AssessmentWindow` on `AssessmentTab` (image open, fixed 3-pane)
```txt
-------------------------------------------------------------------
|LB|FDB|----------AssessmentWindow(AssessmentTab)---------|--CH-----|
|LB|FDB|----IV----|--------------OTV--------------|---CV--|--CH-----|
-------------------------------------------------------------------
|-------------------------------CI----------------------------------|
-------------------------------------------------------------------
```

### `AssessmentWindow` on `RubricTab`
```txt
-------------------------------------------------------------
|LB|FDB|--------AssessmentWindow(RubricTab)--------|--CH-----|
|LB|FDB|------RSV------|-----------RV--------------|--CH-----|
-------------------------------------------------------------
|---------------------------CI-------------------------------|
-------------------------------------------------------------
```

### Chat collapsed state
```txt
-------------------------------------------------------------
|LB|FDB|--------------AssessmentWindow---------------|CHRrail|
-------------------------------------------------------------
|---------------------------CI-------------------------------|
-------------------------------------------------------------
```

## Region Model

### Main row (top)
Left to right:
1. `LB` (fixed narrow column)
2. `FDB` (fixed narrow column)
3. `AssessmentWindow` (primary flexible column)
4. `CH` (expanded chat column) or `CHR` (collapsed rail)

### Bottom row
- `CI` spans full app width in all states.

## Behavior Rules
1. `AssessmentWindow` always occupies the primary middle workspace column.
2. `CI` is always visible and full-width.
3. `CH` may collapse into `CHR`; when collapsed, only the right chat column width changes.
4. `LB` and `FDB` widths remain fixed; they do not expand when chat collapses.
5. `AssessmentWindow` absorbs reclaimed width when chat collapses.
6. Chat intent from `CI` can re-open `CH`.
7. `AssessmentWindow` tab switch changes only internal content.

## AssessmentWindow Internal Layout

### `AssessmentTab`
- Two-pane mode (`IV` closed): `OTV | splitter | CV`
  - splitter is draggable and keyboard-focusable
  - adjusts relative width between `OTV` and `CV`
- Three-pane mode (`IV` open): `IV | OTV | CV`
  - no splitter shown

### `RubricTab`
- Two full-height panes:
  - `RSV` (left)
  - `RV` (right)
- Both panes stretch to bottom of `AssessmentWindow`.

### `CommentsView` internal layout
- Tabs row fixed at top.
- Active tab panel fills remaining vertical space to bottom.

## Sizing Intent (Current Baseline)
- `LB`: `46px`
- `FDB`: `170px`
- `CH` expanded: `320px`
- `CHR` collapsed rail: `8px`
- `CI` row height: `72px`
- Splitter width (Assessment two-pane): `8px`

## Companion: CSS Grid Template Areas

### Global shell grid
```css
.app-shell {
  display: grid;
  height: 100vh;
  grid-template-rows: minmax(0, 1fr) 72px;
  grid-template-columns: 46px 170px minmax(0, 1fr) 320px;
  grid-template-areas:
    "loader files assessment chatview"
    "chatinput chatinput chatinput chatinput";
}

.app-shell[data-chat-collapsed="true"] {
  grid-template-columns: 46px 170px minmax(0, 1fr) 8px;
}

.loader-bar { grid-area: loader; }
.file-display-bar { grid-area: files; }
.assessment-window { grid-area: assessment; }
.chat-view, .chat-collapsed-rail { grid-area: chatview; }
.chat-interface { grid-area: chatinput; }
```

### AssessmentWindow internal grid: `AssessmentTab`
```css
.assessment-tab {
  display: grid;
  height: 100%;
  min-height: 0;
}

/* 2-pane mode with resizable split */
.assessment-tab[data-mode="two-pane"] {
  grid-template-columns:
    minmax(0, calc((100% - 8px) * var(--assessment-left-ratio, 0.66)))
    8px
    minmax(0, calc((100% - 8px) * (1 - var(--assessment-left-ratio, 0.66))));
}

/* 3-pane mode */
.assessment-tab[data-mode="three-pane"] {
  grid-template-columns: minmax(140px, 18%) minmax(0, 1fr) minmax(240px, 34%);
}
```

### AssessmentWindow internal grid: `RubricTab`
```css
.rubric-tab {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(220px, 30%) minmax(0, 1fr);
}
```

### Responsive fallback (current)
```css
@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      "assessment"
      "chatview"
      "chatinput";
    grid-template-rows: minmax(0, 1fr) minmax(180px, 32%) auto;
  }

  .loader-bar,
  .file-display-bar {
    display: none;
  }

  .assessment-tab,
  .rubric-tab {
    grid-template-columns: 1fr;
  }
}
```

## Notes
- Keep `min-width: 0` and `min-height: 0` on pane containers to avoid overflow clipping.
- Split ratio persistence/state is owned by the UI reducer.
- This file is the source of truth for macro and pane layout behavior.
