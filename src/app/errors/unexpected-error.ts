import { AppError } from './app-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Fallback error for unexpected/unmapped failures.
 *
 * @remarks
 * Used when an error cannot be categorized into a more specific {@link AppError} subtype.
 */
export class UnexpectedError extends AppError {
  /**
   * Creates a new {@link UnexpectedError}.
   *
   * @param params Initialization parameters.
   * @param params.userMessage Safe, user-facing message.
   * @param params.correlationId Optional correlation id.
   * @param params.cause Original error.
   */
  public constructor(params: { readonly userMessage: string; readonly correlationId?: string; readonly cause?: unknown }) {
    super({
      name: 'UnexpectedError',
      userMessage: params.userMessage,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      isRetryable: false,
      correlationId: params.correlationId,
      cause: params.cause
    });
  }
}

