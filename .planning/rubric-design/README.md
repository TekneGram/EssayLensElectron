# Rubric For React

A reusable rubric editor component for React with:
- Columns as categories
- Rows as scores
- Descriptions per cell
- Normalized internal state for O(1) cell lookup
- Internal state management with optional external seed data
- Style customization via CSS variables and class slots

Component source: `src/components/rubric`

## Quick Start

```tsx
import { RubricForReact } from './src/components/rubric';
import { buildDraft } from './src/rubricDraft';

const initialDraft = buildDraft({
  rubric: { id: 'rubric-1', name: 'Presentation Rubric', type: 'detailed' },
  details: [
    { id: 'd-1', rubric_id: 'rubric-1', category: 'Content', description: 'Clear thesis and evidence.' },
    { id: 'd-2', rubric_id: 'rubric-1', category: 'Delivery', description: 'Strong eye contact and pacing.' },
  ],
  scores: [
    { id: 's-1', details_id: 'd-1', score_values: 4 },
    { id: 's-2', details_id: 'd-2', score_values: 4 },
  ],
});

export default function App() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <RubricForReact
        sourceData={initialDraft}
        onChange={(next) => {
          // Persist or inspect normalized rubric state here
          console.log(next.cellsByKey);
        }}
      />
      <RubricForReact sourceData={initialDraft} isGrading />
    </div>
  );
}
```

## Props

`RubricForReact` supports:
- `sourceData?: RubricSourceData | NormalizedRubric`
- `isGrading?: boolean` (default `false`)
- `onChange?: (next: NormalizedRubric) => void`
- `className?: string`
- `classes?: Partial<RubricClassNames>`

`sourceData` can be:
- Already normalized rubric state, or
- A lighter source shape (`categories`, `scores`, `cells`) that gets normalized internally

## States

`RubricForReact` supports three interaction states:

- `editing` (default local mode): full editing UI for rubric name, categories, scores, and descriptions.
- `viewing` (local mode): read-only table view, toggled from the edit/view switch button.
- `grading` (external mode): enabled with `isGrading={true}` and overrides local edit/view mode.

### Grading Rules

- Users can select rubric description cells.
- Selection is mutually exclusive by column (category): only one selected cell per category.
- Multiple selections in the same row (score) are allowed.
- Clicking a selected cell deselects it.
- Selected cells are visually highlighted.

## Data Model (Normalized)

The internal/output shape:

```ts
{
  rubricId: string;
  rubricName: string;
  categoryOrder: string[];
  scoreOrder: string[];
  categoriesById: Record<string, { id: string; name: string }>;
  scoresById: Record<string, { id: string; value: number }>;
  cellsByKey: Record<string, { key: string; categoryId: string; scoreId: string; description: string }>;
}
```

Cell key format is `${categoryId}:${scoreId}`. That gives O(1) lookup through `cellsByKey[key]`.

## Styling

Default styles are included automatically by `RubricForReact` (`rubric.css`).

### 1. Override with CSS Variables (recommended)

Apply on a wrapper class passed through `className`:

```tsx
<RubricForReact sourceData={initialDraft} className="my-rubric-theme" />
```

```css
.my-rubric-theme {
  --rubric-surface: #fcfcf8;
  --rubric-text: #1e2430;
  --rubric-border: #c8d0de;
  --rubric-control-border: #9fb0ca;
  --rubric-axis-border: #90a2bd;
  --rubric-delete-bg: #fff1f1;
  --rubric-delete-fg: #a12b2b;
  --rubric-delete-hover-bg: #ffdede;
  --rubric-delete-hover-fg: #7e1e1e;
  --rubric-score-col-width: 7rem;
}
```

Available variables (defined in `src/components/rubric/rubric.css`):
- `--rubric-surface`
- `--rubric-text`
- `--rubric-muted-bg`
- `--rubric-border`
- `--rubric-control-border`
- `--rubric-control-radius`
- `--rubric-axis-border`
- `--rubric-axis-radius`
- `--rubric-delete-border`
- `--rubric-delete-bg`
- `--rubric-delete-fg`
- `--rubric-delete-hover-bg`
- `--rubric-delete-hover-fg`
- `--rubric-score-col-width`

### 2. Slot Class Overrides with `classes`

For targeted overrides, use class slots:

```tsx
<RubricForReact
  sourceData={initialDraft}
  classes={{
    root: 'r-root',
    toolbar: 'r-toolbar',
    tableWrap: 'r-wrap',
    table: 'r-table',
    axisField: 'r-axis-field',
    axisInput: 'r-axis-input',
    deleteButton: 'r-delete',
    cellTextarea: 'r-cell',
  }}
/>
```

Use this when you want to style specific subparts without replacing all theme tokens.

## Behavior Notes

- Add category/score supports button click and Enter key.
- Delete controls in category/score headers appear on hover/focus.
- Category header text is centered, score text is right-aligned.
- Category and score headers are editable inline.
- Rows/columns can be added and removed dynamically.
- In grading mode, the edit/view toggle is hidden and mode is locked to grading.

## Demo In This Repo

`src/App.tsx` now renders two demos:

- Non-grading rubric (`isGrading={false}`) with edit/view toggle.
- Grading rubric (`isGrading={true}`) with selectable cells.

## Exports

From `src/components/rubric`:
- `RubricForReact`
- `useRubricState`
- `normalizeRubric`
- `createCellKey`
- Types: `NormalizedRubric`, `RubricSourceData`, `RubricClassNames`, etc.
