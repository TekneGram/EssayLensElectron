import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createCellKey } from '../services/normalize';
import { RubricTable } from './RubricTable';
import { RubricToolbar } from './RubricToolbar';
import { useRubricState } from '../hooks/useRubricState';
import type { RubricForReactProps } from '../services/types';
import '../styles/rubric.css';

export function RubricForReact({
  sourceData,
  isGrading = false,
  canEdit = true,
  displayMode = 'full',
  className,
  classes,
  mode,
  onModeChange,
  onSelectedCellKeysChange,
  initialSelectedCellKeys,
  onSetRubricName,
  onAddCategory,
  onAddScore,
  onRenameCategory,
  onRemoveCategory,
  onSetScoreValue,
  onRemoveScore,
  onSetCellDescription,
  onChange
}: RubricForReactProps) {
  const [localMode, setLocalMode] = useState<'editing' | 'viewing'>('editing');
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(() => new Set(initialSelectedCellKeys ?? []));
  const lastEmittedSelectionRef = useRef<string>('');
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

  const normalizeSelection = useCallback((keys: Iterable<string>): string => {
    return Array.from(keys).sort().join('||');
  }, []);

  useEffect(() => {
    if (!initialSelectedCellKeys) {
      return;
    }
    const incoming = new Set(initialSelectedCellKeys);
    setSelectedCellKeys((previous) => {
      if (previous.size === incoming.size) {
        let same = true;
        for (const key of previous) {
          if (!incoming.has(key)) {
            same = false;
            break;
          }
        }
        if (same) {
          return previous;
        }
      }
      return incoming;
    });
  }, [initialSelectedCellKeys]);

  useEffect(() => {
    if (!onSelectedCellKeysChange) {
      return;
    }
    const normalized = normalizeSelection(selectedCellKeys);
    if (normalized === lastEmittedSelectionRef.current) {
      return;
    }
    lastEmittedSelectionRef.current = normalized;
    onSelectedCellKeysChange(Array.from(selectedCellKeys));
  }, [normalizeSelection, onSelectedCellKeysChange, selectedCellKeys]);

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
  const effectiveMode = useMemo(() => {
    if (isGrading) {
      return 'grading';
    }
    if (!canEdit) {
      return 'viewing';
    }
    return effectiveEditingMode;
  }, [canEdit, isGrading, effectiveEditingMode]);

  const toggleMode = useCallback(() => {
    const nextMode = effectiveEditingMode === 'editing' ? 'viewing' : 'editing';
    if (mode) {
      onModeChange?.(nextMode);
      return;
    }
    setLocalMode(nextMode);
    onModeChange?.(nextMode);
  }, [effectiveEditingMode, mode, onModeChange]);

  const handleSetRubricName = useCallback(
    (name: string) => {
      setRubricName(name);
      onSetRubricName?.(name);
    },
    [onSetRubricName, setRubricName]
  );

  const handleAddCategory = useCallback(
    (name: string) => {
      addCategory(name);
      onAddCategory?.(name);
    },
    [addCategory, onAddCategory]
  );

  const handleAddScore = useCallback(
    (value: number) => {
      addScore(value);
      onAddScore?.(value);
    },
    [addScore, onAddScore]
  );

  const handleRenameCategory = useCallback(
    (categoryId: string, nextName: string) => {
      const current = state.categoriesById[categoryId];
      renameCategory(categoryId, nextName);
      if (!current || current.name === nextName) {
        return;
      }
      onRenameCategory?.(current.name, nextName);
    },
    [onRenameCategory, renameCategory, state.categoriesById]
  );

  const handleSetScoreValue = useCallback(
    (scoreId: string, nextValue: number) => {
      const current = state.scoresById[scoreId];
      setScoreValue(scoreId, nextValue);
      if (!current || current.value === nextValue) {
        return;
      }
      onSetScoreValue?.(current.value, nextValue);
    },
    [onSetScoreValue, setScoreValue, state.scoresById]
  );

  const handleRemoveCategory = useCallback(
    (categoryId: string) => {
      const current = state.categoriesById[categoryId];
      removeCategory(categoryId);
      if (!current) {
        return;
      }
      onRemoveCategory?.(current.name);
    },
    [onRemoveCategory, removeCategory, state.categoriesById]
  );

  const handleRemoveScore = useCallback(
    (scoreId: string) => {
      const current = state.scoresById[scoreId];
      removeScore(scoreId);
      if (!current) {
        return;
      }
      onRemoveScore?.(current.value);
    },
    [onRemoveScore, removeScore, state.scoresById]
  );

  const handleSetCellDescription = useCallback(
    (categoryId: string, scoreId: string, description: string) => {
      const key = createCellKey(categoryId, scoreId);
      const cell = state.cellsByKey[key];
      setCellDescription(categoryId, scoreId, description);
      if (!cell?.detailId || cell.detailId.startsWith('temp_') || cell.detailId.startsWith('temp:')) {
        return;
      }
      onSetCellDescription?.(cell.detailId, description);
    },
    [onSetCellDescription, setCellDescription, state.cellsByKey]
  );

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
        {!isGrading && canEdit && (
          <button type="button" className="rubric-modebar__toggle" onClick={toggleMode}>
            {effectiveEditingMode === 'editing' ? 'Switch to Viewing' : 'Switch to Editing'}
          </button>
        )}
      </div>
      {effectiveMode === 'editing' && (
        <RubricToolbar
          className={classes?.toolbar}
          rubricName={state.rubricName}
          onRubricNameChange={handleSetRubricName}
          onAddCategory={handleAddCategory}
          onAddScore={handleAddScore}
        />
      )}
      <RubricTable
        state={state}
        mode={effectiveMode}
        selectedCellKeys={selectedCellKeys}
        displayMode={displayMode}
        classNames={{
          tableWrap: classes?.tableWrap,
          table: classes?.table,
          axisField: classes?.axisField,
          axisInput: classes?.axisInput,
          deleteButton: classes?.deleteButton,
          cellTextarea: classes?.cellTextarea
        }}
        onRenameCategory={handleRenameCategory}
        onRemoveCategory={handleRemoveCategory}
        onSetScoreValue={handleSetScoreValue}
        onRemoveScore={handleRemoveScore}
        onSetCellDescription={handleSetCellDescription}
        onSelectCell={selectCell}
        onDeselectCell={deselectCell}
      />
    </section>
  );
}
