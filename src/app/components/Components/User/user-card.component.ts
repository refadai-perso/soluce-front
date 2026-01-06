/**
 * Component for displaying and managing users in a card-based table layout.
 * Similar to problem-card component but for user management.
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModalModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../../../model/model';
import { UserService } from '../../../services/user.service';
import { UserAddComponent } from '../../Pages/user-add.component';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type SortColumn = 'id' | 'email' | 'firstName' | 'surname' | 'admin' | 'creationDate' | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-user-card',
  standalone: true,
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
  imports: [CommonModule, NgbModalModule, NgbTooltipModule, FormsModule]
})
export class UserCardComponent implements OnInit {
  public users$!: Observable<User[] | undefined>;
  public sortColumn: SortColumn = '';
  public sortDirection: SortDirection = '';
  public filterEmail: string = '';
  public filterFirstName: string = '';
  public filterSurname: string = '';
  public filterAdmin: boolean | null = null;
  
  // Row highlighting for updates
  public lastUpdatedUserId: number | null = null;

  constructor(
    private userService: UserService,
    private modalService: NgbModal
  ) {}

  public ngOnInit(): void {
    this.users$ = this.userService.fetchUsers().pipe(
      map((users: User[] | undefined) => this.filterAndSortUsers(users))
    );
  }

  /**
   * Handles sorting when a column header is clicked.
   * @param column The column to sort by
   */
  public onSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.refreshData();
  }

  /**
   * Handles filter changes.
   */
  public onFilterChange(): void {
    this.refreshData();
  }

  /**
   * Clears all filters.
   */
  public clearFilters(): void {
    this.filterEmail = '';
    this.filterFirstName = '';
    this.filterSurname = '';
    this.filterAdmin = null;
    this.refreshData();
  }

  /**
   * Toggles the admin filter.
   */
  public toggleAdminFilter(): void {
    if (this.filterAdmin === null) {
      this.filterAdmin = true;
    } else if (this.filterAdmin === true) {
      this.filterAdmin = false;
    } else {
      this.filterAdmin = null;
    }
    this.onFilterChange();
  }

  /**
   * Returns the text for the admin filter button.
   * @returns The filter button text
   */
  public getAdminFilterText(): string {
    if (this.filterAdmin === null) {
      return $localize`All`;
    } else if (this.filterAdmin === true) {
      return $localize`Admin only`;
    } else {
      return $localize`Non-admin only`;
    }
  }

  /**
   * Refreshes the data by reapplying filters and sorting.
   */
  private refreshData(): void {
    this.users$ = this.userService.fetchUsers().pipe(
      map((users: User[] | undefined) => this.filterAndSortUsers(users))
    );
  }

  /**
   * Filters and sorts the users based on current filter and sort settings.
   * @param users The array of users to filter and sort
   * @returns The filtered and sorted array of users
   */
  private filterAndSortUsers(users: User[] | undefined): User[] | undefined {
    if (!users) {
      return users;
    }

    let filteredUsers: User[] = [...users];

    // Apply filters
    if (this.filterEmail) {
      const lowerFilterEmail: string = this.filterEmail.toLowerCase();
      filteredUsers = filteredUsers.filter((user: User) => 
        user.email?.toLowerCase().includes(lowerFilterEmail)
      );
    }

    if (this.filterFirstName) {
      const lowerFilterFirstName: string = this.filterFirstName.toLowerCase();
      filteredUsers = filteredUsers.filter((user: User) => 
        user.firstName?.toLowerCase().includes(lowerFilterFirstName)
      );
    }

    if (this.filterSurname) {
      const lowerFilterSurname: string = this.filterSurname.toLowerCase();
      filteredUsers = filteredUsers.filter((user: User) => 
        user.surname?.toLowerCase().includes(lowerFilterSurname)
      );
    }

    if (this.filterAdmin !== null) {
      filteredUsers = filteredUsers.filter((user: User) => 
        user.admin === this.filterAdmin
      );
    }

    // Apply sorting using native JavaScript
    if (this.sortColumn && this.sortDirection) {
      filteredUsers.sort((a: User, b: User) => {
        let aValue: any;
        let bValue: any;

        switch (this.sortColumn) {
          case 'id':
            aValue = a.id || 0;
            bValue = b.id || 0;
            break;
          case 'email':
            aValue = (a.email || '').toLowerCase();
            bValue = (b.email || '').toLowerCase();
            break;
          case 'firstName':
            aValue = (a.firstName || '').toLowerCase();
            bValue = (b.firstName || '').toLowerCase();
            break;
          case 'surname':
            aValue = (a.surname || '').toLowerCase();
            bValue = (b.surname || '').toLowerCase();
            break;
          case 'admin':
            aValue = a.admin ? 1 : 0;
            bValue = b.admin ? 1 : 0;
            break;
          case 'creationDate':
            aValue = a.creationDate ? new Date(a.creationDate).getTime() : 0;
            bValue = b.creationDate ? new Date(b.creationDate).getTime() : 0;
            break;
          default:
            aValue = '';
            bValue = '';
        }

        // Compare values
        if (aValue < bValue) {
          return this.sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return this.sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredUsers;
  }

  /**
   * Returns the sort icon class based on current sort state.
   * @param column The column to check
   * @returns The Bootstrap icon class
   */
  public getSortIcon(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  /**
   * Returns the full name of a user.
   * @param user The User object
   * @returns A string with the full name or '-' if no name is provided
   */
  public getUserFullName(user: User): string {
    const firstName: string = user.firstName || '';
    const surname: string = user.surname || '';
    const fullName: string = `${firstName} ${surname}`.trim() || '-';
    return fullName;
  }

  /**
   * Checks if a user row should be highlighted as recently updated.
   * @param userId The ID of the user to check
   * @returns True if the user was recently updated and should be highlighted
   */
  public isRowHighlighted(userId: number | undefined): boolean {
    return userId !== undefined && userId === this.lastUpdatedUserId;
  }

  /**
   * Opens the create user modal dialog.
   */
  public openCreateUserModal(): void {
    // Blur any focused element to prevent aria-hidden accessibility warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    const modalRef = this.modalService.open(UserAddComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.initialValue = null;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        // Handle successful creation
        console.log('User created successfully', result);
        this.refreshData();
      },
      (reason) => {
        // Handle dismissal
        console.log('Modal dismissed', reason);
      }
    );
  }

  /**
   * Opens the edit user modal dialog with existing user data.
   * @param user The user to edit
   */
  public openEditUserModal(user: User): void {
    // Blur any focused element to prevent aria-hidden accessibility warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    const modalRef = this.modalService.open(UserAddComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.initialValue = user;
    modalRef.componentInstance.isEditMode = true;

    modalRef.result.then(
      (result) => {
        // Handle successful update
        console.log('User updated successfully', result);
        
        // Highlight the updated row
        this.lastUpdatedUserId = result.id || null;
        
        this.refreshData();
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          this.lastUpdatedUserId = null;
        }, 3000);
      },
      (reason) => {
        // Handle dismissal
        console.log('Modal dismissed', reason);
      }
    );
  }
}

