import { useCallback, useEffect, useMemo, useState } from 'react';
import { createCellKey } from './normalize';
import { RubricTable } from './RubricTable';
import { RubricToolbar } from './RubricToolbar';
import { useRubricState } from './useRubricState';
import type { RubricForReactProps } from './types';
import './rubric.css';

export function RubricForReact({
  sourceData,
  isGrading = false,
  className,
  classes,
  onChange,
}: RubricForReactProps) {
  const [mode, setMode] = useState<'editing' | 'viewing'>('editing');
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(() => new Set());
  const {
    state,
    addCategory,
    addScore,
    removeCategory,
    removeScore,
    renameCategory,
    setCellDescription,
    setRubricName,
    setScoreValue,
  } = useRubricState(sourceData);

  useEffect(() => {
    onChange?.(state);
  }, [onChange, state]);

  useEffect(() => {
    setSelectedCellKeys((previous) => {
      const next = new Set<string>();
      for (const key of previous) {
        if (state.cellsByKey[key]) {
          next.add(key);
        }
      }
      return next.size === previous.size ? previous : next;
    });
  }, [state.cellsByKey]);

  const effectiveMode = useMemo(() => (isGrading ? 'grading' : mode), [isGrading, mode]);

  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'editing' ? 'viewing' : 'editing'));
  }, []);

  const selectCell = useCallback(
    (categoryId: string, scoreId: string) => {
      if (!isGrading) return;
      const key = createCellKey(categoryId, scoreId);

      setSelectedCellKeys((previous) => {
        const next = new Set<string>();
        for (const existingKey of previous) {
          const existingCell = state.cellsByKey[existingKey];
          if (!existingCell) continue;
          if (existingCell.categoryId === categoryId) continue;
          next.add(existingKey);
        }

        next.add(key);
        return next;
      });
    },
    [isGrading, state.cellsByKey],
  );

  const deselectCell = useCallback(
    (categoryId: string, scoreId: string) => {
      if (!isGrading) return;
      const key = createCellKey(categoryId, scoreId);
      setSelectedCellKeys((previous) => {
        if (!previous.has(key)) return previous;
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    },
    [isGrading],
  );

  return (
    <section className={["rubric", className, classes?.root].filter(Boolean).join(' ')}>
      <div className="rubric-modebar">
        <h2 className="rubric-modebar__title">
          {state.rubricName}
          {isGrading && <span className="rubric-modebar__tag">can grade</span>}
        </h2>
        {!isGrading && (
          <button type="button" className="rubric-modebar__toggle" onClick={toggleMode}>
            {mode === 'editing' ? 'Switch to Viewing' : 'Switch to Editing'}
          </button>
        )}
      </div>
      {effectiveMode === 'editing' && (
        <RubricToolbar
          className={classes?.toolbar}
          rubricName={state.rubricName}
          onRubricNameChange={setRubricName}
          onAddCategory={addCategory}
          onAddScore={addScore}
        />
      )}
      <RubricTable
        state={state}
        mode={effectiveMode}
        selectedCellKeys={selectedCellKeys}
        classNames={{
          tableWrap: classes?.tableWrap,
          table: classes?.table,
          axisField: classes?.axisField,
          axisInput: classes?.axisInput,
          deleteButton: classes?.deleteButton,
          cellTextarea: classes?.cellTextarea,
        }}
        onRenameCategory={renameCategory}
        onRemoveCategory={removeCategory}
        onSetScoreValue={setScoreValue}
        onRemoveScore={removeScore}
        onSetCellDescription={setCellDescription}
        onSelectCell={selectCell}
        onDeselectCell={deselectCell}
      />
    </section>
  );
}
