export function RubricTab() {
  return (
    <div className="rubric-tab workspace rubric" data-testid="rubric-tab">
      <section className="rubric-selection-view subpane" aria-label="Rubric selection view">
        <h4>RubricSelectionView</h4>
        <div className="content-block">RubricSelectionView</div>
      </section>
      <section className="rubric-view subpane" aria-label="Rubric view">
        <h4>RubricView</h4>
        <div className="content-block">RubricView</div>
      </section>
    </div>
  );
}
