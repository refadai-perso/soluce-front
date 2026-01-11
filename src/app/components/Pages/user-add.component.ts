/**
 * Modal component wrapper for user form.
 * Used to display user creation/editing form in a modal dialog.
 */

import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserFormComponent } from '../Components/User/user-form.component';
import { User } from '../../model';

@Component({
  selector: 'app-user-add',
  standalone: true,
  templateUrl: './user-add.component.html',
  imports: [UserFormComponent, CommonModule]
})
export class UserAddComponent {
  private activeModal = inject(NgbActiveModal);

  @Input() initialValue: User | null = null;
  @Input() isEditMode: boolean = false;

  public onUserSubmit(user: User): void {
    this.activeModal.close(user);
  }

  public onCancel(): void {
    this.activeModal.dismiss('cancel');
  }

  public triggerFormSubmit(): void {
    // Find the form element and trigger submit
    const formElement = document.querySelector('app-user-form form') as HTMLFormElement;
    if (formElement) {
      formElement.requestSubmit();
    }
  }

  public getModalTitle(): string {
    return this.isEditMode ? $localize`Edit User` : $localize`Create New User`;
  }

  public getSubmitButtonLabel(): string {
    return this.isEditMode ? $localize`Update User` : $localize`Create User`;
  }
}




