import { ApiHttpError } from './api-http-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';
import { FieldError } from './field-error';

/**
 * Represents validation-related HTTP errors (usually 400), with optional field-level details.
 */
export class ValidationError extends ApiHttpError {
  /**
   * Optional list of field-level validation errors for precise form feedback.
   */
  public readonly fieldErrors: ReadonlyArray<FieldError>;

  /**
   * Creates a new {@link ValidationError}.
   *
   * @param params Initialization parameters.
   */
  public constructor(params: {
    readonly status: number;
    readonly statusText: string;
    readonly url: string;
    readonly method: string;
    readonly backendBody: unknown;
    readonly userMessage: string;
    readonly fieldErrors: ReadonlyArray<FieldError>;
    readonly correlationId?: string;
    readonly cause?: unknown;
  }) {
    super({
      name: 'ValidationError',
      userMessage: params.userMessage,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      isRetryable: false,
      status: params.status,
      statusText: params.statusText,
      url: params.url,
      method: params.method,
      backendBody: params.backendBody,
      correlationId: params.correlationId,
      cause: params.cause
    });
    this.fieldErrors = params.fieldErrors;
  }
}

