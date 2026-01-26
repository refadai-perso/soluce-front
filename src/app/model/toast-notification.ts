import { ToastType } from './toast-type';

/**
 * Immutable toast notification model.
 */
export interface ToastNotification {
  /**
   * Unique toast identifier used for tracking and dismissal.
   */
  readonly id: number;
  /**
   * Message intended for end users (safe to display).
   */
  readonly message: string;
  /**
   * Visual level used for styling.
   */
  readonly type: ToastType;
  /**
   * Whether the toast should auto-dismiss after {@link delayMs}.
   */
  readonly autohide: boolean;
  /**
   * Auto-dismiss delay (milliseconds).
   */
  readonly delayMs: number;
}

