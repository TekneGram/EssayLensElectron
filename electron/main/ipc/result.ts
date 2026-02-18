export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export type AppResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export function notImplementedResult(operation: string): AppResult<never> {
  return {
    ok: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: `${operation} is not implemented yet.`
    }
  };
}
