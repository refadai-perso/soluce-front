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
   * Emits the ID of the group that was updated.
   * Parent component should refresh the groups list and highlight the updated group.
   */
  @Output() membersUpdated: EventEmitter<number> = new EventEmitter<number>();

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
   * Pending member IDs that will be applied when "Add selection" is clicked.
   * This allows users to make multiple changes before committing them.
   */
  private pendingMemberIds: number[] = [];

  /**
   * Gets the current member IDs from the group.
   * @returns Array of member IDs
   */
  private getCurrentMemberIds(): number[] {
    return this.currentGroup?.memberIds || [];
  }

  /**
   * Gets the pending member IDs (for display purposes).
   * @returns Array of pending member IDs
   */
  private getPendingMemberIds(): number[] {
    return this.pendingMemberIds;
  }

  /**
   * Gets the list of users that are currently selected as members (pending selection).
   * @returns Array of User objects that are in the pending selection
   */
  public getCurrentMembers(): User[] {
    if (!this.availableUsers) {
      return [];
    }
    const memberIds: number[] = this.getPendingMemberIds();
    if (memberIds.length === 0) {
      return [];
    }
    return this.availableUsers.filter((user: User) => 
      user.id !== undefined && memberIds.includes(user.id)
    );
  }

  /**
   * Gets the list of users available to add (not in pending selection).
   * @returns Array of User objects that can be added
   */
  public getAvailableUsersForSelection(): User[] {
    if (!this.availableUsers) {
      return [];
    }
    const memberIds: number[] = this.getPendingMemberIds();
    const filtered: User[] = this.availableUsers.filter((user: User) => {
      // Exclude users that are already in the pending selection
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
   * Handles clicking on a user to add them to the pending selection.
   * @param user The user to add
   */
  public onAddUser(user: User): void {
    if (user.id === undefined) {
      return;
    }

    const pendingMemberIds: number[] = this.getPendingMemberIds();
    if (pendingMemberIds.includes(user.id)) {
      return; // Already in selection
    }

    this.pendingMemberIds = [...pendingMemberIds, user.id];
  }

  /**
   * Handles clicking on a member to remove them from the pending selection.
   * @param user The user to remove
   */
  public onRemoveUser(user: User): void {
    if (user.id === undefined) {
      return;
    }

    this.pendingMemberIds = this.pendingMemberIds.filter((id: number) => id !== user.id);
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
        // Update pending selection to match the saved state
        this.pendingMemberIds = [...(updated.memberIds || [])];
        // Reset search filter
        this.searchFilter = '';
        // Notify parent to refresh and highlight the updated group
        this.membersUpdated.emit(groupId);
        // Close the panel after successful update
        this.close.emit();
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
   * Handles closing the panel and cancels any pending changes.
   */
  public onClose(): void {
    this.searchFilter = '';
    this.pendingMemberIds = [];
    this.close.emit();
  }

  /**
   * Applies the pending selection to the group.
   * Updates the group members with the pending member IDs and closes the panel.
   */
  public onApplySelection(): void {
    if (!this.currentGroup || !this.currentGroup.id) {
      return;
    }

    this.updateGroupMembers(this.currentGroup.id, this.pendingMemberIds);
    // Panel will be closed after successful update in updateGroupMembers
  }

  /**
   * Checks if there are pending changes that differ from the current group members.
   * @returns True if there are pending changes, false otherwise
   */
  public hasPendingChanges(): boolean {
    const currentMemberIds: number[] = this.getCurrentMemberIds();
    const pendingMemberIds: number[] = this.getPendingMemberIds();
    
    if (currentMemberIds.length !== pendingMemberIds.length) {
      return true;
    }
    
    return !currentMemberIds.every((id: number) => pendingMemberIds.includes(id));
  }

  /**
   * Handles changes to inputs.
   */
  public ngOnChanges(changes: SimpleChanges): void {
    // Initialize pending selection when panel opens or group changes
    if (changes['isOpen'] && this.isOpen) {
      this.pendingMemberIds = [...this.getCurrentMemberIds()];
      if (this.availableUsers.length === 0) {
        this.fetchUsers();
      }
    }

    // Reset when group changes
    if (changes['currentGroup'] && this.currentGroup) {
      this.pendingMemberIds = [...this.getCurrentMemberIds()];
    }

    // Reset search filter when panel closes
    if (changes['isOpen'] && !this.isOpen) {
      this.searchFilter = '';
      this.pendingMemberIds = [];
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



