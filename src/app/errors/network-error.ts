import { AppError } from './app-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Represents connectivity issues (DNS, offline, CORS blocked, status=0).
 *
 * @remarks
 * Generated when the browser cannot reach the backend (HttpClient error status `0`).
 */
export class NetworkError extends AppError {
  /**
   * Creates a new {@link NetworkError}.
   *
   * @param params Initialization parameters.
   * @param params.userMessage Safe, user-facing message.
   * @param params.correlationId Optional correlation id.
   * @param params.cause Original error.
   */
  public constructor(params: { readonly userMessage: string; readonly correlationId?: string; readonly cause?: unknown }) {
    super({
      name: 'NetworkError',
      userMessage: params.userMessage,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.ERROR,
      isRetryable: true,
      correlationId: params.correlationId,
      cause: params.cause
    });
  }
}

