/**
 * Modal component wrapper for group form.
 * Used to display group creation/editing form in a modal dialog.
 */

import { CommonModule } from '@angular/common';
import { Component, inject, Input, ViewChild } from '@angular/core';
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

  /**
   * Reference to the GroupFormComponent child component.
   * Used to programmatically trigger form submission.
   */
  @ViewChild(GroupFormComponent) groupFormComponent!: GroupFormComponent;

  public onGroupSubmit(group: Group): void {
    this.activeModal.close(group);
  }

  public onCancel(): void {
    this.activeModal.dismiss('cancel');
  }

  /**
   * Programmatically triggers form submission.
   * Calls the onSubmit() method directly on the GroupFormComponent instance.
   * This is the proper Angular way to interact with child components, using ViewChild
   * instead of DOM queries. This ensures type safety and respects component encapsulation.
   * This is typically called from a button outside the form (e.g., modal footer button)
   * to submit the form when the user clicks the submit button in the modal header.
   * @returns void
   */
  public triggerFormSubmit(): void {
    if (this.groupFormComponent) {
      this.groupFormComponent.onSubmit();
    }
  }

}



