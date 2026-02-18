import { appErr } from '../../shared/appResult';
import type { AppResult } from '../../shared/appResult';

export function notImplementedResult(operation: string): AppResult<never> {
  return appErr({
    code: 'NOT_IMPLEMENTED',
    message: `${operation} is not implemented yet.`
  });
}
