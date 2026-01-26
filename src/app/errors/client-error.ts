import { AppError } from './app-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Represents a local, non-HTTP error (UI/business rule).
 *
 * @remarks
 * Use this when an operation fails before contacting the backend (e.g., missing prerequisites).
 */
export class ClientError extends AppError {
  /**
   * Creates a new {@link ClientError}.
   *
   * @param params Initialization parameters.
   * @param params.userMessage Safe, user-facing message.
   * @param params.category Error category for UX.
   * @param params.severity Error severity for UX.
   * @param params.isRetryable Whether retrying can succeed.
   * @param params.correlationId Optional correlation id.
   * @param params.cause Original error.
   */
  public constructor(params: {
    readonly userMessage: string;
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly isRetryable: boolean;
    readonly correlationId?: string;
    readonly cause?: unknown;
  }) {
    super({
      name: 'ClientError',
      userMessage: params.userMessage,
      category: params.category,
      severity: params.severity,
      isRetryable: params.isRetryable,
      correlationId: params.correlationId,
      cause: params.cause
    });
  }
}

