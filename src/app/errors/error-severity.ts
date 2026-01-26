/**
 * Severity drives how intrusive the UI feedback should be.
 */
export enum ErrorSeverity {
  /**
   * Informational (typically no action required).
   */
  INFO = 'info',
  /**
   * Recoverable issue requiring user attention.
   */
  WARNING = 'warning',
  /**
   * Failure requiring user attention.
   */
  ERROR = 'error',
  /**
   * Critical failure (may warrant stronger UX or support contact).
   */
  CRITICAL = 'critical'
}

