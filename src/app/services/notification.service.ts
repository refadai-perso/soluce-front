import { Injectable, Signal, WritableSignal, signal } from '@angular/core';

import { ToastNotification } from '../model/toast-notification';
import { ToastType } from '../model/toast-type';
import { AppError } from '../errors/app-error';
import { ErrorSeverity } from '../errors/error-severity';

/**
 * Manages user notifications (currently: toast notifications).
 *
 * @remarks
 * This service exposes a read-only signal of active toasts and APIs to add/dismiss them.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  /**
   * Internal signal holding active toasts.
   */
  private readonly activeToastsSignal: WritableSignal<ToastNotification[]> = signal<ToastNotification[]>([]);
  /**
   * Monotonic ID generator for toast tracking.
   */
  private nextId: number = 1;

  /**
   * Read-only signal for active toast notifications.
   */
  public readonly toasts: Signal<ToastNotification[]> = this.activeToastsSignal.asReadonly();

  /**
   * Displays an error toast derived from a typed {@link AppError}.
   *
   * @param error The typed application error.
   */
  public showErrorFromAppError(error: AppError): void {
    const toastType: ToastType = this.mapSeverityToToastType(error.severity);
    const message: string = error.userMessage;
    this.showToast({ message: message, type: toastType, autohide: true, delayMs: 6000 });
  }

  /**
   * Displays a success toast.
   *
   * @param message Message intended for end users.
   */
  public showSuccess(message: string): void {
    this.showToast({ message: message, type: ToastType.SUCCESS, autohide: true, delayMs: 3500 });
  }

  /**
   * Displays an informational toast.
   *
   * @param message Message intended for end users.
   */
  public showInfo(message: string): void {
    this.showToast({ message: message, type: ToastType.INFO, autohide: true, delayMs: 4500 });
  }

  /**
   * Displays a warning toast.
   *
   * @param message Message intended for end users.
   */
  public showWarning(message: string): void {
    this.showToast({ message: message, type: ToastType.WARNING, autohide: true, delayMs: 6000 });
  }

  /**
   * Removes a toast from the active list.
   *
   * @param toastId Toast identifier.
   */
  public dismissToast(toastId: number): void {
    const current: ToastNotification[] = this.activeToastsSignal();
    const next: ToastNotification[] = current.filter((toast: ToastNotification): boolean => toast.id !== toastId);
    this.activeToastsSignal.set(next);
  }

  private showToast(params: { readonly message: string; readonly type: ToastType; readonly autohide: boolean; readonly delayMs: number }): void {
    const toast: ToastNotification = {
      id: this.nextId,
      message: params.message,
      type: params.type,
      autohide: params.autohide,
      delayMs: params.delayMs
    };
    this.nextId = this.nextId + 1;
    const current: ToastNotification[] = this.activeToastsSignal();
    this.activeToastsSignal.set([...current, toast]);
  }

  private mapSeverityToToastType(severity: ErrorSeverity): ToastType {
    switch (severity) {
      case ErrorSeverity.INFO:
        return ToastType.INFO;
      case ErrorSeverity.WARNING:
        return ToastType.WARNING;
      case ErrorSeverity.CRITICAL:
        return ToastType.ERROR;
      case ErrorSeverity.ERROR:
      default:
        return ToastType.ERROR;
    }
  }
}

