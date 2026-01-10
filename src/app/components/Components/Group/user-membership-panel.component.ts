/**
 * Component for managing user memberships in a group.
 * Displays a slide-in side panel with searchable user list for adding/removing members.
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../model/model';

@Component({
  selector: 'app-user-membership-panel',
  standalone: true,
  templateUrl: './user-membership-panel.component.html',
  styleUrls: ['./user-membership-panel.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class UserMembershipPanelComponent implements OnChanges {
  /**
   * Available users to select from.
   */
  @Input() availableUsers: User[] = [];

  /**
   * IDs of users that are currently members of the group.
   */
  @Input() currentMemberIds: number[] = [];

  /**
   * Whether the panel is currently open/visible.
   */
  @Input() isOpen: boolean = false;

  /**
   * Emits when the panel should be closed.
   */
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Emits when a user is added to the group.
   * Emits: userId (number)
   */
  @Output() userAdded: EventEmitter<number> = new EventEmitter<number>();

  /**
   * Emits when a user is removed from the group.
   * Emits: userId (number)
   */
  @Output() userRemoved: EventEmitter<number> = new EventEmitter<number>();

  /**
   * Search filter for users.
   */
  public searchFilter: string = '';

  /**
   * Gets the list of users that are currently members.
   * @returns Array of User objects that are members
   */
  public getCurrentMembers(): User[] {
    if (!this.availableUsers || this.currentMemberIds.length === 0) {
      return [];
    }
    return this.availableUsers.filter((user: User) => 
      user.id !== undefined && this.currentMemberIds.includes(user.id)
    );
  }

  /**
   * Gets the list of users available to add (not currently members).
   * @returns Array of User objects that can be added
   */
  public getAvailableUsersForSelection(): User[] {
    if (!this.availableUsers) {
      return [];
    }
    const filtered: User[] = this.availableUsers.filter((user: User) => {
      // Exclude users that are already members
      if (user.id !== undefined && this.currentMemberIds.includes(user.id)) {
        return false;
      }
      // Apply search filter
      if (this.searchFilter.trim() === '') {
        return true;
      }
      const searchLower: string = this.searchFilter.toLowerCase();
      const fullName: string = this.getUserFullName(user).toLowerCase();
      const email: string = (user.email || '').toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
    return filtered;
  }

  /**
   * Gets the full name of a user.
   * @param user The User object
   * @returns A string with the full name or email if no name is provided
   */
  public getUserFullName(user: User): string {
    const firstName: string = user.firstName || '';
    const surname: string = user.surname || '';
    const fullName: string = `${firstName} ${surname}`.trim();
    return fullName || user.email || '';
  }

  /**
   * Handles clicking on a user to add them to the group.
   * @param user The user to add
   */
  public onAddUser(user: User): void {
    if (user.id !== undefined) {
      this.userAdded.emit(user.id);
    }
  }

  /**
   * Handles clicking on a member to remove them from the group.
   * @param user The user to remove
   */
  public onRemoveUser(user: User): void {
    if (user.id !== undefined) {
      this.userRemoved.emit(user.id);
    }
  }

  /**
   * Handles closing the panel.
   */
  public onClose(): void {
    this.searchFilter = '';
    this.close.emit();
  }

  /**
   * Handles changes to inputs.
   */
  public ngOnChanges(changes: SimpleChanges): void {
    // Reset search filter when panel closes
    if (changes['isOpen'] && !this.isOpen) {
      this.searchFilter = '';
    }
  }
}



