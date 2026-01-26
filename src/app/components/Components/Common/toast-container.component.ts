import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

import { NotificationService } from '../../../services/notification.service';
import { ToastNotification } from '../../../model/toast-notification';
import { ToastType } from '../../../model/toast-type';

/**
 * Global toast container rendered once at app root level.
 *
 * @remarks
 * Reads toast notifications from {@link NotificationService} and renders them using ng-bootstrap toasts.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
  imports: [CommonModule, NgbToastModule]
})
export class ToastContainerComponent {
  /**
   * Notification service providing the toast stream and dismissal APIs.
   */
  public readonly notificationService: NotificationService = inject(NotificationService);

  /**
   * Maps a toast notification to a Bootstrap contextual class.
   *
   * @param toast The toast notification to style.
   * @returns CSS classes to apply on the toast element.
   */
  public getToastClass(toast: ToastNotification): string {
    const baseClass: string = 'border-0 shadow-sm';
    if (toast.type === ToastType.SUCCESS) {
      return `${baseClass} text-bg-success`;
    }
    if (toast.type === ToastType.INFO) {
      return `${baseClass} text-bg-info`;
    }
    if (toast.type === ToastType.WARNING) {
      return `${baseClass} text-bg-warning`;
    }
    return `${baseClass} text-bg-danger`;
  }
}

