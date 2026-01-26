import { AppError } from './app-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Represents client-side timeouts.
 *
 * @remarks
 * Intended for explicit timeout operators (not currently produced by HttpClient by default).
 */
export class TimeoutError extends AppError {
  /**
   * Creates a new {@link TimeoutError}.
   *
   * @param params Initialization parameters.
   * @param params.userMessage Safe, user-facing message.
   * @param params.correlationId Optional correlation id.
   * @param params.cause Original error.
   */
  public constructor(params: { readonly userMessage: string; readonly correlationId?: string; readonly cause?: unknown }) {
    super({
      name: 'TimeoutError',
      userMessage: params.userMessage,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.ERROR,
      isRetryable: true,
      correlationId: params.correlationId,
      cause: params.cause
    });
  }
}

