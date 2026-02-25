interface RubricSelectionItem {
  entityUuid: string;
  name: string;
}

interface RubricSelectionProps {
  rubrics: RubricSelectionItem[];
  selectedRubricId: string | null;
  isPending: boolean;
  isError: boolean;
  onSelect: (rubricId: string) => void;
  onCreate: () => void | Promise<void>;
}

export function RubricSelection(props: RubricSelectionProps) {
  const { rubrics, selectedRubricId, isPending, isError, onSelect, onCreate } = props;

  return (
    <section className="rubric-selection-view subpane" aria-label="Rubric selection view">
      <h4>Rubric Selection</h4>
      <div className="content-block" role="listbox" aria-label="Rubrics">
        {isPending ? <div>Loading rubrics...</div> : null}
        {isError ? <div>Unable to load rubrics.</div> : null}
        {!isPending && !isError && rubrics.length === 0 ? <div>No rubrics available.</div> : null}
        {rubrics.map((rubric) => (
          <button
            key={rubric.entityUuid}
            type="button"
            className={selectedRubricId === rubric.entityUuid ? 'tab active is-active' : 'tab'}
            aria-selected={selectedRubricId === rubric.entityUuid}
            onClick={() => onSelect(rubric.entityUuid)}
          >
            {rubric.name}
          </button>
        ))}
      </div>
      <div className="content-block">
        <button type="button" onClick={onCreate}>
          New Rubric
        </button>
      </div>
    </section>
  );
}
