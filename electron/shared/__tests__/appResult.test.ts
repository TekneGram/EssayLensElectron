import { describe, expect, it } from 'vitest';
import { appErr, appOk, isAppResultFailure, isAppResultSuccess } from '../appResult';

describe('AppResult envelope contracts', () => {
  it('narrows success envelope correctly', () => {
    const result = appOk({ id: 'file-1' });

    expect(isAppResultSuccess(result)).toBe(true);
    expect(isAppResultFailure(result)).toBe(false);

    if (isAppResultSuccess(result)) {
      expect(result.data.id).toBe('file-1');
    }
  });

  it('narrows failure envelope correctly', () => {
    const result = appErr({
      code: 'NOT_FOUND',
      message: 'File missing.'
    });

    expect(isAppResultFailure(result)).toBe(true);
    expect(isAppResultSuccess(result)).toBe(false);

    if (isAppResultFailure(result)) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('File missing.');
    }
  });
});
