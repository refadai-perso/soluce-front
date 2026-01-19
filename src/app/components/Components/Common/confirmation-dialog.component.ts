/**
 * Generic confirmation dialog component.
 * Reusable modal dialog for confirming actions with customizable title, message, and button labels.
 */

import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  templateUrl: './confirmation-dialog.component.html',
  imports: [CommonModule]
})
export class ConfirmationDialogComponent {
  /**
   * Service for managing the modal dialog.
   */
  public activeModal: NgbActiveModal = inject(NgbActiveModal);

  /**
   * Title of the confirmation dialog.
   * Defaults to "Confirm" if not provided.
   */
  @Input() title: string = $localize`Confirm`;

  /**
   * Message to display in the dialog body.
   * Can contain HTML content (e.g., <strong> tags).
   */
  @Input() message: string = '';

  /**
   * Label for the confirm/action button.
   * Defaults to "Confirm" if not provided.
   */
  @Input() confirmButtonLabel: string = $localize`Confirm`;

  /**
   * Label for the cancel button.
   * Defaults to "Cancel" if not provided.
   */
  @Input() cancelButtonLabel: string = $localize`Cancel`;

  /**
   * CSS class for the confirm button (e.g., 'btn-danger' for delete actions).
   * Defaults to 'btn-primary' if not provided.
   */
  @Input() confirmButtonClass: string = 'btn-primary';

  /**
   * Value to return when the confirm button is clicked.
   * Defaults to 'confirm' if not provided.
   */
  @Input() confirmValue: string = 'confirm';

  /**
   * Value to return when the cancel button is clicked.
   * Defaults to 'cancel' if not provided.
   */
  @Input() cancelValue: string = 'cancel';

  /**
   * Initializes the confirmation dialog with the provided parameters.
   * This method respects encapsulation by providing a single entry point for configuration.
   * All parameters are optional and will use default values if not provided.
   * @param title Title of the confirmation dialog
   * @param message Message to display in the dialog body (can contain HTML)
   * @param confirmButtonLabel Label for the confirm/action button
   * @param cancelButtonLabel Label for the cancel button
   * @param confirmButtonClass CSS class for the confirm button (e.g., 'btn-danger')
   * @param confirmValue Value to return when the confirm button is clicked
   * @param cancelValue Value to return when the cancel button is clicked
   */
  public initialize(
    title?: string,
    message?: string,
    confirmButtonLabel?: string,
    cancelButtonLabel?: string,
    confirmButtonClass?: string,
    confirmValue?: string,
    cancelValue?: string
  ): void {
    if (title !== undefined) {
      this.title = title;
    }
    if (message !== undefined) {
      this.message = message;
    }
    if (confirmButtonLabel !== undefined) {
      this.confirmButtonLabel = confirmButtonLabel;
    }
    if (cancelButtonLabel !== undefined) {
      this.cancelButtonLabel = cancelButtonLabel;
    }
    if (confirmButtonClass !== undefined) {
      this.confirmButtonClass = confirmButtonClass;
    }
    if (confirmValue !== undefined) {
      this.confirmValue = confirmValue;
    }
    if (cancelValue !== undefined) {
      this.cancelValue = cancelValue;
    }
  }

  /**
   * Handles the confirm button click.
   * Closes the modal with the confirm value.
   */
  public onConfirm(): void {
    this.activeModal.close(this.confirmValue);
  }

  /**
   * Handles the cancel button click.
   * Dismisses the modal with the cancel value.
   */
  public onCancel(): void {
    this.activeModal.dismiss(this.cancelValue);
  }
}
