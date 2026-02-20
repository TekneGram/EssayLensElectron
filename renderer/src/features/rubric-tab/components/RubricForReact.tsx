import { useCallback, useEffect, useMemo, useState } from 'react';
import { createCellKey } from '../services/normalize';
import { RubricTable } from './RubricTable';
import { RubricToolbar } from './RubricToolbar';
import { useRubricState } from '../hooks/useRubricState';
import type { RubricForReactProps } from '../services/types';
import '../styles/rubric.css';

export function RubricForReact({
  sourceData,
  isGrading = false,
  className,
  classes,
  mode,
  onModeChange,
  onSelectedCellKeysChange,
  initialSelectedCellKeys,
  onChange
}: RubricForReactProps) {
  const [localMode, setLocalMode] = useState<'editing' | 'viewing'>('editing');
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(() => new Set(initialSelectedCellKeys ?? []));
  const {
    state,
    addCategory,
    addScore,
    removeCategory,
    removeScore,
    renameCategory,
    setCellDescription,
    setRubricName,
    setScoreValue
  } = useRubricState(sourceData);

  useEffect(() => {
    onChange?.(state);
  }, [onChange, state]);

  useEffect(() => {
    if (!initialSelectedCellKeys) return;
    setSelectedCellKeys(new Set(initialSelectedCellKeys));
  }, [initialSelectedCellKeys]);

  useEffect(() => {
    onSelectedCellKeysChange?.(Array.from(selectedCellKeys));
  }, [onSelectedCellKeysChange, selectedCellKeys]);

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

  const effectiveEditingMode = mode ?? localMode;
  const effectiveMode = useMemo(() => (isGrading ? 'grading' : effectiveEditingMode), [isGrading, effectiveEditingMode]);

  const toggleMode = useCallback(() => {
    const nextMode = effectiveEditingMode === 'editing' ? 'viewing' : 'editing';
    if (mode) {
      onModeChange?.(nextMode);
      return;
    }
    setLocalMode(nextMode);
    onModeChange?.(nextMode);
  }, [effectiveEditingMode, mode, onModeChange]);

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
    [isGrading, state.cellsByKey]
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
    [isGrading]
  );

  return (
    <section className={['rubric', className, classes?.root].filter(Boolean).join(' ')}>
      <div className="rubric-modebar">
        <h2 className="rubric-modebar__title">
          {state.rubricName}
          {isGrading && <span className="rubric-modebar__tag">can grade</span>}
        </h2>
        {!isGrading && (
          <button type="button" className="rubric-modebar__toggle" onClick={toggleMode}>
            {effectiveEditingMode === 'editing' ? 'Switch to Viewing' : 'Switch to Editing'}
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
          cellTextarea: classes?.cellTextarea
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
