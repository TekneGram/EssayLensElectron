# Styles Spec (UI Frame)

## Purpose
Define the implemented visual system for EssayLens, including current light/dark tokens, pane styling, and interaction affordances (tabs, chat collapse rail, and assessment splitter).

## Design Principles
- Readability first for long-form text (essay text, comments, rubric).
- Calm professional palette with low-noise chrome.
- Content hierarchy first; controls are visually secondary.
- Equivalent affordance quality in light and dark themes.

## Theme Model
- Use semantic CSS variables for shared styling behavior.
- Theme is applied via root attribute:
  - `html[data-theme="light"]`
  - `html[data-theme="dark"]`
  - `html[data-theme="system"]` (with `prefers-color-scheme` fallback)
- Keep component styles token-driven.

## CSS Layer Structure
Source of truth:

```txt
renderer/src/styles/
  tokens.css
  themes.css
  base.css
  layout.css
  components.css
```

Import order in `renderer/src/main.tsx`:
1. `tokens.css`
2. `themes.css`
3. `base.css`
4. `layout.css`
5. `components.css`

## Core Semantic Tokens (Current)
- `--bg-app`
- `--bg-surface`
- `--bg-muted`
- `--bg-accent-soft`
- `--chat-surface`
- `--divider-color`
- `--border-subtle`
- `--text-primary`
- `--text-muted`
- `--accent-primary`

Supporting base tokens from `tokens.css` include:
- typography (`--font-sans`, `--font-mono`, `--text-sm`, `--text-md`)
- spacing (`--space-*`)
- radii (`--radius-*`)

## Theme Values (Current Baseline)

### Light
- `--bg-app: #eef3fb`
- `--bg-surface: #ffffff`
- `--bg-muted: #f6f9ff`
- `--bg-accent-soft: #e8f0ff`
- `--chat-surface: #f8fbff`
- `--divider-color: #d3dceb`
- `--border-subtle: #d5ddeb`
- `--text-primary: #162036`
- `--text-muted: #5a6782`
- `--accent-primary: #2e63c7`

### Dark
- `--bg-app: #0f1624`
- `--bg-surface: #162033`
- `--bg-muted: #1a263d`
- `--bg-accent-soft: #1c2f5a`
- `--chat-surface: #111b2d`
- `--divider-color: #2f3d58`
- `--border-subtle: #2d3a55`
- `--text-primary: #edf2ff`
- `--text-muted: #a7b4cc`
- `--accent-primary: #7ea7ff`

## Macro Frame Styling Rules
- Primary columns are flush blocks (no card shadow containers).
- Use 1px seam lines between top-row regions.
- `ChatInterface` has top seam line and remains full width.
- Internal pane padding is compact (`8px` to `10px`).
- Body uses a soft radial accent wash over app background.

## Component Patterns (Current)

### Tabs
- Pill style tabs with explicit active state.
- Active tab markers may be expressed by:
  - `.tab.active`
  - `.tab.is-active`
  - `[aria-selected="true"]`
- Active style combines accent text, accent-tinted background, and stronger border.

### Subpanes (`ImageView`, `OriginalTextView`, `CommentsView`, rubric panes)
- `.subpane` uses muted surface background + rounded corners.
- Title row + scrollable content block.
- `RubricSelectionView` and `RubricView` stretch full column height.

### CommentsView
- Tabs fixed to top.
- Content region (`.comments-content`) fills remaining height.
- Active panel (`.comments-panel`) stretches and scrolls within pane.

### ChatView
- Header row with collapse toggle.
- Message list uses chat bubble surfaces by role:
  - system: accent-soft background
  - teacher: mixed neutral tint
  - assistant: surface background

### Collapsed Chat Rail
- Right column collapses to thin rail (`8px`).
- Rail contains expand toggle with focus-visible treatment.
- Rail remains high-contrast in both themes.

### Assessment Splitter (OTV/CV in two-pane mode)
- Vertical `8px` separator with `col-resize` cursor.
- Hover/focus states increase visibility.
- Keyboard-focusable (`role="separator"`) and pointer-draggable.

## Interaction States
Define clear visual feedback for:
- hover
- focus-visible
- active/selected
- disabled (where applicable)

Rule:
- Selection should not rely on color alone; combine color + border/weight.

## Accessibility Baseline
- Maintain visible focus rings on keyboard-interactive controls.
- Keep text contrast at or above AA intent for body/UI text.
- Preserve semantic roles/ARIA for tabs and separator controls.

## Responsive Behavior (Current)
- At `max-width: 900px`:
  - hide `LoaderBar` and `FileDisplayBar`
  - stack `AssessmentWindow`, `ChatView`, and `ChatInterface`
  - flatten `AssessmentTab` and `RubricTab` to single-column mode
- `ChatInterface` remains visible in all responsive states.

## Do / Do Not
- Do keep component styles token-driven.
- Do preserve seam-based macro framing over card-heavy chrome.
- Do keep collapse/resize affordances visible and keyboard reachable.
- Do not introduce one-off hex values in feature styles when a semantic token exists.
- Do not remove bottom chat interface visibility in collapsed chat mode.
