# Layout Spec (UI Frame)

## Purpose
Define the canonical UI frame and region layout for EssayLens across top-level tab states.

## Scope
- In scope:
  - Global shell regions and placement
  - `AssessmentWindow` layout for both `AssessmentTab` and `RubricTab`
  - Chat region placement
  - Baseline sizing intent
- Out of scope:
  - Feature interaction logic
  - Data fetching/persistence behavior
  - Detailed resize/collapse mechanics (see pane-resize spec)

## Component Codes
- `LB` = `LoaderBar`
- `FDB` = `FileDisplayBar`
- `IV` = `ImageView`
- `OTV` = `OriginalTextView`
- `CV` = `CommentsView`
- `RSV` = `RubricSelectionView`

## Canonical Layout Diagrams

### When `AssessmentWindow` is on `AssessmentTab`
```txt
---------------------------------------------------------
|LB|FDB|----AssessmentWindow(AssessmentTab)--|-ChatView-|
|LB|FDB|-----IV----|----OTV----|---CV--------|-ChatView-|
---------------------------------------------------------
|--------------------ChatInterface----------------------|
---------------------------------------------------------
```

### When `AssessmentWindow` is on `RubricTab`
```txt
---------------------------------------------------------
|LB|FDB|------AssessmentWindow(RubricTab)----|-ChatView-|
|LB|FDB|---RSV---|-----------RubricView------|-ChatView-|
---------------------------------------------------------
|--------------------ChatInterface----------------------|
---------------------------------------------------------
```

## Region Model

### Main row (top)
Left to right:
1. `LB` (narrow, tall)
2. `FDB` (narrow, tall)
3. `AssessmentWindow` (primary workspace area)
4. `ChatView` (right-side conversation/history area)

### Bottom row
- `ChatInterface` spans full width of the app.

## AssessmentWindow Internal Layout

### `AssessmentTab` mode
- Primary internal panes:
  - `OTV`
  - `CV`
- Optional pane:
  - `IV` (visible/open when image file is selected; otherwise collapsed)

### `RubricTab` mode
- Two internal panes:
  - `RSV` (left)
  - `RubricView` (right, primary)

## Sizing Intent (Baseline)
- `LB`, `FDB`: narrow utility columns.
- `AssessmentWindow`: largest flexible column.
- `ChatView`: medium-width column.
- `ChatInterface`: fixed bottom band (full width).

## Layout Rules
1. `AssessmentWindow` always occupies the primary middle workspace column.
2. `ChatView` is always visible in the right column.
3. `ChatInterface` is always visible at the bottom and full-width.
4. Tab switch in `AssessmentWindow` changes only its internal content, not global shell structure.

## Companion: Suggested CSS Grid Template Areas

### Global shell grid
Use a 2-row grid:
- Row 1: main workspace (`LB`, `FDB`, `AssessmentWindow`, `ChatView`)
- Row 2: full-width `ChatInterface`

```css
.app-shell {
  display: grid;
  height: 100vh;
  gap: 0.5rem;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: 56px 220px minmax(0, 1fr) 320px;
  grid-template-areas:
    "loader files assessment chatview"
    "chatinput chatinput chatinput chatinput";
}

.loader-bar { grid-area: loader; }
.file-display-bar { grid-area: files; }
.assessment-window { grid-area: assessment; }
.chat-view { grid-area: chatview; }
.chat-interface { grid-area: chatinput; }
```

### AssessmentWindow internal grid: `AssessmentTab` (3-pane capable)
- Default (image hidden/collapsed): 2 panes
- Image selected: 3 panes

```css
.assessment-tab {
  display: grid;
  height: 100%;
  gap: 0.5rem;
  min-width: 0;
}

/* 2-pane mode */
.assessment-tab[data-mode="two-pane"] {
  grid-template-columns: minmax(0, 1fr) minmax(280px, 36%);
  grid-template-areas: "otv cv";
}

/* 3-pane mode */
.assessment-tab[data-mode="three-pane"] {
  grid-template-columns: minmax(180px, 22%) minmax(0, 1fr) minmax(280px, 32%);
  grid-template-areas: "iv otv cv";
}

.image-view { grid-area: iv; min-width: 0; }
.original-text-view { grid-area: otv; min-width: 0; }
.comments-view { grid-area: cv; min-width: 0; }
```

### AssessmentWindow internal grid: `RubricTab`
```css
.rubric-tab {
  display: grid;
  height: 100%;
  gap: 0.5rem;
  min-width: 0;
  grid-template-columns: minmax(220px, 30%) minmax(0, 1fr);
  grid-template-areas: "rsv rubric";
}

.rubric-selection-view { grid-area: rsv; min-width: 0; }
.rubric-view { grid-area: rubric; min-width: 0; }
```

### Responsive fallback (example)
At narrower widths, stack the global columns and keep `ChatInterface` at bottom.

```css
@media (max-width: 1280px) {
  .app-shell {
    grid-template-columns: 56px minmax(180px, 28%) minmax(0, 1fr);
    grid-template-areas:
      "loader files assessment"
      "loader files chatview"
      "chatinput chatinput chatinput";
    grid-template-rows: minmax(0, 1fr) minmax(220px, 34%) auto;
  }
}

@media (max-width: 980px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      "loader"
      "files"
      "assessment"
      "chatview"
      "chatinput";
    grid-template-rows: auto auto minmax(0, 1fr) minmax(180px, 32%) auto;
  }
}
```

### Notes
- Use `min-width: 0` on pane containers to prevent overflow clipping issues.
- If draggable resizing is enabled, these column values become dynamic inline styles or CSS variables.
- Keep area names stable so feature components can map consistently.

## Notes
- Panel card styling is optional; plain `div` containers are acceptable for initial frame build.
- Keep this file as the source of truth for macro layout only.
- Use feature specs for behavior details.
