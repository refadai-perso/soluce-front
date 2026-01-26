/**
 * High-level categorization of errors for UX decisions.
 */
export enum ErrorCategory {
  /**
   * Invalid input / constraint issues.
   */
  VALIDATION = 'validation',
  /**
   * Authentication issues (missing/expired session).
   */
  AUTHENTICATION = 'authentication',
  /**
   * Authorization issues (insufficient permissions).
   */
  AUTHORIZATION = 'authorization',
  /**
   * Missing resource.
   */
  NOT_FOUND = 'not_found',
  /**
   * Connectivity issues (offline/DNS/CORS blocked).
   */
  NETWORK = 'network',
  /**
   * Backend server error.
   */
  SERVER = 'server',
  /**
   * Unknown/unclassified error.
   */
  UNKNOWN = 'unknown'
}

