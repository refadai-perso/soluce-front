/**
 * Confirmation dialog component for deleting a group.
 */

import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Group } from '../../../model/model';

@Component({
  selector: 'app-group-delete-confirm',
  standalone: true,
  template: `
    <div class="modal-header">
      <h4 class="modal-title" i18n>Confirm Deletion</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss('cancel')" i18n-aria-label></button>
    </div>
    <div class="modal-body" i18n>
      Are you sure you want to delete group <strong>{{ getGroupDisplayName() }}</strong>? This action cannot be undone.
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss('cancel')" i18n>Cancel</button>
      <button type="button" class="btn btn-danger" (click)="activeModal.close('delete')" i18n>Delete</button>
    </div>
  `,
  imports: [CommonModule]
})
export class GroupDeleteConfirmComponent {
  public activeModal: NgbActiveModal = inject(NgbActiveModal);

  @Input() group: Group | null = null;

  /**
   * Returns a display name for the group.
   * @returns The group's name or "Unknown" if not available
   */
  public getGroupDisplayName(): string {
    if (!this.group) {
      return $localize`:@@unknown:Unknown`;
    }
    return this.group.name || $localize`:@@unknown:Unknown`;
  }
}



