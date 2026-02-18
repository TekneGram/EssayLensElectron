import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../../App';

describe('AssessmentWindow tabs', () => {
  it('defaults to assessment tab selected', () => {
    render(<App />);

    const assessmentTab = screen.getByRole('tab', { name: 'Assessment' });
    const rubricTab = screen.getByRole('tab', { name: 'Rubric' });
    const assessmentPanel = screen.getByTestId('assessment-panel');
    const rubricPanel = screen.getByTestId('rubric-panel');

    expect(assessmentTab.getAttribute('aria-selected')).toBe('true');
    expect(rubricTab.getAttribute('aria-selected')).toBe('false');
    expect(assessmentPanel.hasAttribute('hidden')).toBe(false);
    expect(rubricPanel.hasAttribute('hidden')).toBe(true);
  });

  it('switches panels and aria-selected on tab click', () => {
    render(<App />);

    const assessmentTab = screen.getByRole('tab', { name: 'Assessment' });
    const rubricTab = screen.getByRole('tab', { name: 'Rubric' });

    fireEvent.click(rubricTab);

    const assessmentPanel = screen.getByTestId('assessment-panel');
    const rubricPanel = screen.getByTestId('rubric-panel');

    expect(assessmentTab.getAttribute('aria-selected')).toBe('false');
    expect(rubricTab.getAttribute('aria-selected')).toBe('true');
    expect(assessmentPanel.hasAttribute('hidden')).toBe(true);
    expect(rubricPanel.hasAttribute('hidden')).toBe(false);
  });
});
