import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Base class for all application-level errors (HTTP, network, local validation, unexpected).
 *
 * @remarks
 * - `userMessage` must be safe to show to end users.
 * - `category` and `severity` allow consistent UX decisions (toast/alert/redirect).
 */
export abstract class AppError extends Error {
  /**
   * Creation timestamp for logging and debugging.
   */
  public readonly timestamp: Date;
  /**
   * Message intended for end users (safe and actionable).
   */
  public readonly userMessage: string;
  /**
   * High-level error category used for UX decisions.
   */
  public readonly category: ErrorCategory;
  /**
   * Error severity used to select toast/alert behavior.
   */
  public readonly severity: ErrorSeverity;
  /**
   * Indicates whether retrying the failed action can reasonably succeed.
   */
  public readonly isRetryable: boolean;
  /**
   * Optional correlation identifier (when provided by backend or gateway).
   */
  public readonly correlationId: string | undefined;

  /**
   * Creates a new {@link AppError}.
   *
   * @param params Initialization parameters.
   */
  public constructor(params: {
    readonly name: string;
    readonly userMessage: string;
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly isRetryable: boolean;
    readonly correlationId?: string;
    readonly cause?: unknown;
  }) {
    super(params.userMessage, { cause: params.cause as unknown });
    this.name = params.name;
    this.timestamp = new Date();
    this.userMessage = params.userMessage;
    this.category = params.category;
    this.severity = params.severity;
    this.isRetryable = params.isRetryable;
    this.correlationId = params.correlationId;
  }
}

