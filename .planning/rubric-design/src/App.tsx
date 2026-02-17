import './App.css';
import { RubricForReact } from './components/rubric';
import { buildDraft } from './rubricDraft';

const initialDraft = buildDraft({
  rubric: {
    id: 'rubric-1',
    name: 'Presentation Rubric',
    type: 'detailed',
  },
  details: [
    { id: 'd-1', rubric_id: 'rubric-1', category: 'Content', description: 'Clear thesis and evidence.' },
    { id: 'd-2', rubric_id: 'rubric-1', category: 'Content', description: 'Some claims need support.' },
    { id: 'd-3', rubric_id: 'rubric-1', category: 'Delivery', description: 'Strong eye contact and pacing.' },
    { id: 'd-4', rubric_id: 'rubric-1', category: 'Delivery', description: 'Occasional pauses and fillers.' },
  ],
  scores: [
    { id: 's-1', details_id: 'd-1', score_values: 4 },
    { id: 's-2', details_id: 'd-2', score_values: 2 },
    { id: 's-3', details_id: 'd-3', score_values: 4 },
    { id: 's-4', details_id: 'd-4', score_values: 2 },
  ],
});

function App() {
  return (
    <main className="app-shell">
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <RubricForReact sourceData={initialDraft} isGrading={false} />
        <RubricForReact sourceData={initialDraft} isGrading />
      </div>
    </main>
  );
}

export default App;
