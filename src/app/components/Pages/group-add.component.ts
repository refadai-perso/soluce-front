/**
 * Modal component wrapper for group form.
 * Used to display group creation/editing form in a modal dialog.
 */

import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GroupFormComponent } from '../Components/Group/group-form.component';
import { Group } from '../../model';

@Component({
  selector: 'app-group-add',
  standalone: true,
  templateUrl: './group-add.component.html',
  imports: [GroupFormComponent, CommonModule]
})
export class GroupAddComponent {
  private activeModal = inject(NgbActiveModal);

  @Input() initialValue: Group | null = null;
  @Input() isEditMode: boolean = false;

  public onGroupSubmit(group: Group): void {
    this.activeModal.close(group);
  }

  public onCancel(): void {
    this.activeModal.dismiss('cancel');
  }

  public triggerFormSubmit(): void {
    // Find the form element and trigger submit
    const formElement = document.querySelector('app-group-form form') as HTMLFormElement;
    if (formElement) {
      formElement.requestSubmit();
    }
  }

  public getModalTitle(): string {
    return this.isEditMode ? $localize`Edit Group` : $localize`Create New Group`;
  }

  public getSubmitButtonLabel(): string {
    return this.isEditMode ? $localize`Update Group` : $localize`Create Group`;
  }
}



