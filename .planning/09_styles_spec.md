# Styles Spec (UI Frame)

## Purpose
Define a consistent visual system for EssayLens that is sleek, modern, and supports both light mode and dark mode.

## Design Principles
- Readability first for long-form text (essays, comments, rubric rows).
- Calm, professional visual language (avoid loud saturation).
- Strong hierarchy: content first, controls second.
- Theme parity: light and dark should have equivalent clarity and affordances.

## Theme Model
- Use CSS variables for all semantic tokens.
- Apply theme at root via attribute:
  - `html[data-theme="light"]`
  - `html[data-theme="dark"]`
- Avoid hard-coded colors in component-level styles.

## CSS Folder Structure

Use `renderer/src/styles/` as the source of truth for global styling layers:

```txt
renderer/src/styles/
  tokens.css          # semantic design tokens (colors, spacing, radii, motion)
  themes.css          # light/dark token values and theme selectors
  base.css            # reset + html/body defaults + typography defaults
  layout.css          # app shell, grid areas, pane/layout scaffolding
  components.css      # shared component-level patterns (tabs, buttons, cards, dividers)
  utilities.css       # optional utility classes
  __tests__/
    themes.test.ts    # theme token and root selector behavior checks
    layout.test.tsx   # shell/layout class behavior checks
```

Feature-local styles should live with the feature:

```txt
renderer/src/features/<feature>/components/<Component>.css
renderer/src/features/<feature>/components/__tests__/<Component>.style.test.tsx
```

Import order recommendation (in `renderer/src/main.tsx`):
1. `tokens.css`
2. `themes.css`
3. `base.css`
4. `layout.css`
5. `components.css`
6. feature-local CSS imports from components

## Core Tokens

### Color tokens (semantic)
- `--bg-app`
- `--bg-surface`
- `--bg-surface-elevated`
- `--bg-muted`
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- `--border-subtle`
- `--border-strong`
- `--accent-primary`
- `--accent-primary-hover`
- `--accent-contrast`
- `--success`
- `--warning`
- `--danger`
- `--focus-ring`
- `--shadow-color`

### Typography tokens
- `--font-sans`: `"Plus Jakarta Sans", "Inter", system-ui, sans-serif`
- `--font-mono`: `"JetBrains Mono", "SFMono-Regular", monospace`
- `--text-xs`, `--text-sm`, `--text-md`, `--text-lg`, `--text-xl`
- `--line-tight`, `--line-normal`, `--line-relaxed`

### Spacing/radius tokens
- `--space-1`..`--space-8` (4px scale)
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`
- `--pane-divider-width`
- `--pane-divider-hit-width`

### Motion tokens
- `--dur-fast` (`120ms`)
- `--dur-base` (`180ms`)
- `--dur-slow` (`260ms`)
- `--ease-standard`

## Theme Values (baseline)

### Light theme
- `--bg-app: #f4f6fb`
- `--bg-surface: #ffffff`
- `--bg-surface-elevated: #ffffff`
- `--bg-muted: #eef2f8`
- `--text-primary: #121826`
- `--text-secondary: #344054`
- `--text-muted: #667085`
- `--border-subtle: #e2e8f0`
- `--border-strong: #cbd5e1`
- `--accent-primary: #2f5ec4`
- `--accent-primary-hover: #254ea8`
- `--accent-contrast: #ffffff`
- `--focus-ring: #7aa2ff`

### Dark theme
- `--bg-app: #0f1420`
- `--bg-surface: #151c2b`
- `--bg-surface-elevated: #1b2436`
- `--bg-muted: #1f2a3f`
- `--text-primary: #eef2ff`
- `--text-secondary: #c6d0e5`
- `--text-muted: #94a3b8`
- `--border-subtle: #2a344a`
- `--border-strong: #3a4865`
- `--accent-primary: #7aa2ff`
- `--accent-primary-hover: #93b4ff`
- `--accent-contrast: #0f1420`
- `--focus-ring: #9bb8ff`

## Layout and Component Style Rules
- App frame uses flush region blocks at the macro level (no card framing on primary columns).
- Keep macro layout spacing compact by default:
  - shell outer padding: `0px` for the primary app frame
  - inter-pane gap: `0px` at macro level
  - internal pane padding: `8px` to `12px`
- Distinguish primary regions by background color first, not heavy borders.
- Use very thin seam lines between primary regions:
  - vertical separators between `LoaderBar`, `FileDisplayBar`, `AssessmentWindow`, `ChatView`
  - horizontal separator above `ChatInterface`
  - separator thickness: `1px`
- Tabs have a clear active state (accent underline or pill + text weight).
- Resizer dividers use `col-resize` cursor and visible/focusable hit zones.
- Collapsed pane handles remain visible and high-contrast in both themes.
- Text-heavy surfaces (`OriginalTextView`, comments, rubric cells) use relaxed line-height and generous padding, with minimal chrome.

## Interaction States
Define explicit styles for:
- hover
- active
- selected
- focused
- disabled
- error
- loading/skeleton

Rule:
- Do not rely on color alone for selection. Combine color + border and/or icon/text emphasis.

## Accessibility Requirements
- Body text contrast: WCAG AA minimum (`4.5:1`).
- Large labels/UI text: minimum `3:1`.
- Focus rings are always visible (minimum 2px equivalent).
- Respect `prefers-reduced-motion` for transitions/animations.

## Theming Behavior
- Default theme follows `prefers-color-scheme`.
- User override persists in local storage.
- Theme switch is token-driven and does not require component-level style rewrites.

## Responsive Layout Behavior
- On small screens, hide `LoaderBar` and `FileDisplayBar` to prioritize core workspace.
- Recommended breakpoints:
  - `<= 920px`: hide `LoaderBar` + `FileDisplayBar`; show `AssessmentWindow` and `ChatView` side by side.
  - `<= 700px`: stack `AssessmentWindow` above `ChatView`.
- Keep `ChatInterface` visible at the bottom in all responsive modes.

## Do / Do Not
- Do use semantic tokens in all feature styles.
- Do keep grading and writing views readable first.
- Do keep spacing and radii consistent with token scale.
- Do keep macro layout flush and use seam lines for separation.
- Do not introduce one-off hex values in component CSS.
- Do not use pure black/white backgrounds; use softened tones.
- Do not wrap primary app columns in card-like borders/shadows.
