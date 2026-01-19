/**
 * Component for managing user memberships in a group.
 * Displays a slide-in side panel with searchable user list for adding/removing members.
 * Self-contained component that handles its own data fetching and operations.
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../model/model';
import { Group } from '../../../model/model';
import { UserService } from '../../../services/user.service';
import { GroupService } from '../../../services/group.service';
import { Subscription } from 'rxjs';
import { UpdateGroupDto } from '@shared/dto/group/update-group.dto';

@Component({
  selector: 'app-user-membership-panel',
  standalone: true,
  templateUrl: './user-membership-panel.component.html',
  styleUrls: ['./user-membership-panel.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class UserMembershipPanelComponent implements OnChanges {
  /**
   * The group for which to manage memberships.
   */
  @Input() currentGroup: Group | null = null;

  /**
   * Whether the panel is currently open/visible.
   */
  @Input() isOpen: boolean = false;

  /**
   * Emits when the panel should be closed.
   */
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Emits when group members have been updated.
   * Parent component should refresh the groups list.
   */
  @Output() membersUpdated: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Service for managing user operations.
   */
  private userService: UserService = inject(UserService);

  /**
   * Service for managing group operations.
   */
  private groupService: GroupService = inject(GroupService);

  /**
   * Available users to select from.
   * Fetched when panel opens.
   */
  public availableUsers: User[] = [];

  /**
   * Search filter for users.
   */
  public searchFilter: string = '';

  /**
   * Whether users are currently being fetched.
   */
  public isLoadingUsers: boolean = false;

  /**
   * Gets the current member IDs from the group.
   * @returns Array of member IDs
   */
  private getCurrentMemberIds(): number[] {
    return this.currentGroup?.memberIds || [];
  }

  /**
   * Gets the list of users that are currently members.
   * @returns Array of User objects that are members
   */
  public getCurrentMembers(): User[] {
    if (!this.availableUsers || !this.currentGroup) {
      return [];
    }
    const memberIds: number[] = this.getCurrentMemberIds();
    if (memberIds.length === 0) {
      return [];
    }
    return this.availableUsers.filter((user: User) => 
      user.id !== undefined && memberIds.includes(user.id)
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
    const memberIds: number[] = this.getCurrentMemberIds();
    const filtered: User[] = this.availableUsers.filter((user: User) => {
      // Exclude users that are already members
      if (user.id !== undefined && memberIds.includes(user.id)) {
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
    if (!this.currentGroup || !this.currentGroup.id || user.id === undefined) {
      return;
    }

    const currentMemberIds: number[] = this.getCurrentMemberIds();
    if (currentMemberIds.includes(user.id)) {
      return; // Already a member
    }

    const updatedMemberIds: number[] = [...currentMemberIds, user.id];
    this.updateGroupMembers(this.currentGroup.id, updatedMemberIds);
  }

  /**
   * Handles clicking on a member to remove them from the group.
   * @param user The user to remove
   */
  public onRemoveUser(user: User): void {
    if (!this.currentGroup || !this.currentGroup.id || user.id === undefined) {
      return;
    }

    const currentMemberIds: number[] = this.getCurrentMemberIds();
    const updatedMemberIds: number[] = currentMemberIds.filter((id: number) => id !== user.id);
    this.updateGroupMembers(this.currentGroup.id, updatedMemberIds);
  }

  /**
   * Updates the group members by calling the update service.
   * @param groupId The ID of the group to update
   * @param memberIds The new list of member IDs
   */
  private updateGroupMembers(groupId: number, memberIds: number[]): void {
    const updateData: UpdateGroupDto = { memberIds };
    const updateMembersSubscription: Subscription = this.groupService.updateGroup(groupId, updateData).subscribe({
      next: (updated: Group): void => {
        console.log('Group members updated successfully:', updated);
        // Update the group reference
        if (this.currentGroup) {
          this.currentGroup.memberIds = updated.memberIds;
        }
        // Notify parent to refresh
        this.membersUpdated.emit();
      },
      error: (error: unknown): void => {
        console.error('Error updating group members:', error);
        // Could show an error toast/alert here
      }
    });
    // Note: In a real app, you'd want to manage this subscription properly
    // For now, we'll let it complete naturally
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
    // Fetch users when panel opens
    if (changes['isOpen'] && this.isOpen && this.availableUsers.length === 0) {
      this.fetchUsers();
    }

    // Reset search filter when panel closes
    if (changes['isOpen'] && !this.isOpen) {
      this.searchFilter = '';
    }
  }

  /**
   * Fetches users from the service.
   */
  private fetchUsers(): void {
    this.isLoadingUsers = true;
    const usersSubscription: Subscription = this.userService.fetchUsers().subscribe({
      next: (users: User[]): void => {
        this.availableUsers = users;
        this.isLoadingUsers = false;
      },
      error: (error: unknown): void => {
        console.error('Error fetching users for membership panel:', error);
        this.isLoadingUsers = false;
      }
    });
    // Note: In a real app, you'd want to manage this subscription properly
    // For now, we'll let it complete naturally
  }
}



