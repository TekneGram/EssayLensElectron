import { createCellKey } from '../services/normalize';
import type { NormalizedRubric, RubricInteractionMode } from '../services/types';

interface RubricTableProps {
  state: NormalizedRubric;
  mode: RubricInteractionMode;
  selectedCellKeys?: Set<string>;
  onRenameCategory: (categoryId: string, name: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  onSetScoreValue: (scoreId: string, value: number) => void;
  onRemoveScore: (scoreId: string) => void;
  onSetCellDescription: (categoryId: string, scoreId: string, description: string) => void;
  onSelectCell?: (categoryId: string, scoreId: string) => void;
  onDeselectCell?: (categoryId: string, scoreId: string) => void;
  classNames?: {
    tableWrap?: string;
    table?: string;
    axisField?: string;
    axisInput?: string;
    deleteButton?: string;
    cellTextarea?: string;
  };
}

export function RubricTable(props: RubricTableProps) {
  const {
    state,
    mode,
    selectedCellKeys,
    onRenameCategory,
    onRemoveCategory,
    onSetScoreValue,
    onRemoveScore,
    onSetCellDescription,
    onSelectCell,
    onDeselectCell,
    classNames
  } = props;
  const isEditing = mode === 'editing';
  const isGrading = mode === 'grading';

  return (
    <div className={['rubric-table-wrap', classNames?.tableWrap].filter(Boolean).join(' ')}>
      <table className={['rubric-table', classNames?.table].filter(Boolean).join(' ')}>
        <colgroup>
          <col className="rubric-table__score-col" />
          <col span={state.categoryOrder.length} />
        </colgroup>
        <thead>
          <tr>
            <th>Score</th>
            {state.categoryOrder.map((categoryId) => {
              const category = state.categoriesById[categoryId];
              return (
                <th key={categoryId}>
                  <div
                    className={['rubric-axis-field', 'rubric-axis-field--category', classNames?.axisField]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className={['rubric-axis-field__delete', classNames?.deleteButton]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => onRemoveCategory(categoryId)}
                          aria-label={`Delete category ${category.name}`}
                        >
                          <span className="rubric-axis-field__delete-icon" aria-hidden="true" />
                        </button>
                        <input
                          className={[
                            'rubric-axis-field__input',
                            'rubric-axis-field__input--category',
                            classNames?.axisInput
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          value={category.name}
                          onChange={(event) => onRenameCategory(categoryId, event.target.value)}
                          aria-label={`Category ${category.name}`}
                        />
                      </>
                    ) : (
                      <div className="rubric-axis-field__value rubric-axis-field__value--category">{category.name}</div>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {state.scoreOrder.map((scoreId) => {
            const score = state.scoresById[scoreId];
            return (
              <tr key={scoreId}>
                <th>
                  <div
                    className={['rubric-axis-field', 'rubric-axis-field--score', classNames?.axisField]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className={['rubric-axis-field__delete', classNames?.deleteButton]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => onRemoveScore(scoreId)}
                          aria-label={`Delete score ${score.value}`}
                        >
                          <span className="rubric-axis-field__delete-icon" aria-hidden="true" />
                        </button>
                        <input
                          className={[
                            'rubric-axis-field__input',
                            'rubric-axis-field__input--score',
                            classNames?.axisInput
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          value={score.value}
                          onChange={(event) => onSetScoreValue(scoreId, Number(event.target.value))}
                          inputMode="numeric"
                          aria-label={`Score ${score.value}`}
                        />
                      </>
                    ) : (
                      <div className="rubric-axis-field__value rubric-axis-field__value--score">{score.value}</div>
                    )}
                  </div>
                </th>
                {state.categoryOrder.map((categoryId) => {
                  const key = createCellKey(categoryId, scoreId);
                  const cell = state.cellsByKey[key];
                  const isSelected = Boolean(selectedCellKeys?.has(key));
                  return (
                    <td key={key}>
                      {isEditing ? (
                        <textarea
                          className={classNames?.cellTextarea}
                          value={cell?.description ?? ''}
                          onChange={(event) => onSetCellDescription(categoryId, scoreId, event.target.value)}
                          placeholder="Description"
                        />
                      ) : isGrading ? (
                        <button
                          type="button"
                          className={[
                            'rubric-table__grade-cell',
                            isSelected ? 'rubric-table__grade-cell--selected' : ''
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => (isSelected ? onDeselectCell : onSelectCell)?.(categoryId, scoreId)}
                          onDoubleClick={() => onDeselectCell?.(categoryId, scoreId)}
                          aria-pressed={isSelected}
                        >
                          {cell?.description ?? ''}
                        </button>
                      ) : (
                        <div className="rubric-table__cell-text">{cell?.description ?? ''}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
