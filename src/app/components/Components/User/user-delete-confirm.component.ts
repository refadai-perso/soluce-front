/**
 * Confirmation dialog component for deleting a user.
 */

import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../../../model/model';

@Component({
  selector: 'app-user-delete-confirm',
  standalone: true,
  template: `
    <div class="modal-header">
      <h4 class="modal-title" i18n>Confirm Deletion</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss('cancel')" i18n-aria-label></button>
    </div>
    <div class="modal-body" i18n>
      Are you sure you want to delete user <strong>{{ getUserDisplayName() }}</strong>? This action cannot be undone.
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss('cancel')" i18n>Cancel</button>
      <button type="button" class="btn btn-danger" (click)="activeModal.close('delete')" i18n>Delete</button>
    </div>
  `,
  imports: [CommonModule]
})
export class UserDeleteConfirmComponent {
  public activeModal: NgbActiveModal = inject(NgbActiveModal);

  @Input() user: User | null = null;

  /**
   * Returns a display name for the user.
   * @returns The user's full name or email, or "Unknown" if neither is available
   */
  public getUserDisplayName(): string {
    if (!this.user) {
      return $localize`:@@unknown:Unknown`;
    }
    const firstName: string = this.user.firstName || '';
    const surname: string = this.user.surname || '';
    const fullName: string = `${firstName} ${surname}`.trim();
    if (fullName) {
      return `${fullName} (${this.user.email || ''})`;
    }
    return this.user.email || $localize`:@@unknown:Unknown`;
  }
}

