/**
 * Component for displaying and managing users in a card-based table layout.
 * Similar to problem-card component but for user management.
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModalModule, NgbModal, NgbTooltipModule, NgbDropdownModule, NgbDatepickerModule, NgbDateStruct, NgbDropdown, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../../../model/model';
import { UserService } from '../../../services/user.service';
import { UserAddComponent } from '../../Pages/user-add.component';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { format, isAfter, isBefore, isEqual } from 'date-fns';
import {
  ngbDateToDate,
  dateToNgbDate
} from '../../../utils/date-sort-utils';

type SortColumn = 'id' | 'email' | 'firstName' | 'surname' | 'admin' | 'creationDate' | '';
type SortDirection = 'asc' | 'desc' | '';

interface DateRangePreset {
  label: string;
  icon: string;
  getValue: () => { from: Date; to: Date };
}

@Component({
  selector: 'app-user-card',
  standalone: true,
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
  imports: [CommonModule, NgbModalModule, NgbTooltipModule, NgbDropdownModule, NgbDatepickerModule, FormsModule]
})
export class UserCardComponent implements OnInit {
  public users$!: Observable<User[] | undefined>;
  public sortColumn: SortColumn = '';
  public sortDirection: SortDirection = '';
  public filterEmail: string = '';
  public filterFirstName: string = '';
  public filterSurname: string = '';
  public filterAdmin: boolean | null = null;
  public filterCreationDateFrom: string = '';
  public filterCreationDateTo: string = '';
  
  // Row highlighting for updates
  public lastUpdatedUserId: number | null = null;
  
  // Date picker properties
  public hoveredDate: NgbDateStruct | null = null;
  public fromDate: NgbDateStruct | null = null;
  public toDate: NgbDateStruct | null = null;
  
  /**
   * Date range preset buttons.
   * Using $localize for runtime translation of labels.
   */
  public readonly dateRangePresets: ReadonlyArray<DateRangePreset> = [
    {
      label: $localize`Today`,
      icon: 'bi-calendar-day',
      getValue: (): { from: Date; to: Date } => {
        const now: Date = new Date();
        const today: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end: Date = new Date(today);
        end.setHours(23, 59, 59, 999);
        return { from: today, to: end };
      }
    },
    {
      label: $localize`Last 7 days`,
      icon: 'bi-calendar-week',
      getValue: (): { from: Date; to: Date } => {
        const now: Date = new Date();
        const today: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const from: Date = new Date(today);
        from.setDate(today.getDate() - 6);
        const to: Date = new Date(today);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
    },
    {
      label: $localize`Last 30 days`,
      icon: 'bi-calendar-range',
      getValue: (): { from: Date; to: Date } => {
        const now: Date = new Date();
        const today: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const from: Date = new Date(today);
        from.setDate(today.getDate() - 29);
        const to: Date = new Date(today);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
    },
    {
      label: $localize`This month`,
      icon: 'bi-calendar-month',
      getValue: (): { from: Date; to: Date } => {
        const now: Date = new Date();
        const from: Date = new Date(now.getFullYear(), now.getMonth(), 1);
        const to: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
    },
    {
      label: $localize`Last month`,
      icon: 'bi-calendar3',
      getValue: (): { from: Date; to: Date } => {
        const now: Date = new Date();
        const from: Date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const to: Date = new Date(now.getFullYear(), now.getMonth(), 0);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
    },
    {
      label: $localize`This year`,
      icon: 'bi-calendar4',
      getValue: (): { from: Date; to: Date } => {
        const now: Date = new Date();
        const from: Date = new Date(now.getFullYear(), 0, 1);
        const to: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
    }
  ];

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
    this.fromDate = null;
    this.toDate = null;
    this.filterCreationDateFrom = '';
    this.filterCreationDateTo = '';
    this.refreshData();
  }

  /**
   * Sets the admin filter to a specific value.
   * @param value The filter value (null for all, true for admin, false for user)
   */
  public setAdminFilter(value: boolean | null): void {
    this.filterAdmin = value;
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

    if (this.filterCreationDateFrom) {
      const fromDate: Date = new Date(this.filterCreationDateFrom);
      filteredUsers = filteredUsers.filter((user: User) => {
        if (!user.creationDate) {
          return false;
        }
        const userDate: Date = new Date(user.creationDate);
        return userDate >= fromDate;
      });
    }

    if (this.filterCreationDateTo) {
      const toDate: Date = new Date(this.filterCreationDateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredUsers = filteredUsers.filter((user: User) => {
        if (!user.creationDate) {
          return false;
        }
        const userDate: Date = new Date(user.creationDate);
        return userDate <= toDate;
      });
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

  /**
   * Handles date selection in the datepicker.
   * @param date The selected date
   * @param dropdown The dropdown instance to close when range is complete
   */
  public onDateSelection(date: NgbDateStruct, dropdown?: NgbDropdown): void {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && isAfter(ngbDateToDate(date), ngbDateToDate(this.fromDate))) {
      this.toDate = date;
      this.applyDateRange();
      // Close dropdown after selecting complete range
      if (dropdown) {
        setTimeout(() => dropdown.close(), 300);
      }
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }

  /**
   * Checks if a date is hovered in the range.
   * @param date The date to check
   * @returns True if the date is in the hovered range
   */
  public isHovered(date: NgbDateStruct): boolean {
    if (!this.fromDate || this.toDate || !this.hoveredDate) {
      return false;
    }
    return isAfter(ngbDateToDate(date), ngbDateToDate(this.fromDate)) &&
           isBefore(ngbDateToDate(date), ngbDateToDate(this.hoveredDate));
  }

  /**
   * Checks if a date is inside the selected range.
   * @param date The date to check
   * @returns True if the date is in the range
   */
  public isInside(date: NgbDateStruct): boolean {
    if (!this.toDate || !this.fromDate) {
      return false;
    }
    return isAfter(ngbDateToDate(date), ngbDateToDate(this.fromDate)) &&
           isBefore(ngbDateToDate(date), ngbDateToDate(this.toDate));
  }

  /**
   * Checks if a date is the start or end of the range.
   * @param date The date to check
   * @returns True if the date is a range boundary
   */
  public isRange(date: NgbDateStruct): boolean {
    return (
      (this.fromDate && isEqual(ngbDateToDate(date), ngbDateToDate(this.fromDate))) ||
      (this.toDate && isEqual(ngbDateToDate(date), ngbDateToDate(this.toDate))) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }

  /**
   * Applies a preset date range.
   * @param preset The preset to apply
   */
  public applyPreset(preset: DateRangePreset): void {
    const range: { from: Date; to: Date } = preset.getValue();
    this.fromDate = dateToNgbDate(range.from);
    this.toDate = dateToNgbDate(range.to);
    this.applyDateRange();
  }

  /**
   * Applies the selected date range to the filter.
   */
  private applyDateRange(): void {
    if (this.fromDate) {
      const fromDate: Date = ngbDateToDate(this.fromDate);
      this.filterCreationDateFrom = format(fromDate, 'yyyy-MM-dd');
    }
    if (this.toDate) {
      const toDate: Date = ngbDateToDate(this.toDate);
      this.filterCreationDateTo = format(toDate, 'yyyy-MM-dd');
    }
    this.onFilterChange();
  }

  /**
   * Clears the date range filter.
   */
  public clearDateRange(): void {
    this.fromDate = null;
    this.toDate = null;
    this.filterCreationDateFrom = '';
    this.filterCreationDateTo = '';
    this.onFilterChange();
  }

  /**
   * Navigates the datepicker to today's date.
   * @param datepicker The datepicker instance
   */
  public goToToday(datepicker: NgbDatepicker): void {
    const today: Date = new Date();
    const todayStruct: NgbDateStruct = dateToNgbDate(today);
    datepicker.navigateTo(todayStruct);
  }

  /**
   * Returns the display text for the date filter button.
   * @returns The display text
   */
  public getDateRangeText(): string {
    if (!this.fromDate && !this.toDate) {
      return $localize`Select date range...`;
    }
    if (this.fromDate && this.toDate) {
      return `${this.formatNgbDate(this.fromDate)} - ${this.formatNgbDate(this.toDate)}`;
    }
    if (this.fromDate) {
      return $localize`From` + ` ${this.formatNgbDate(this.fromDate)}`;
    }
    return $localize`Select date range...`;
  }

  /**
   * Formats NgbDateStruct for display using date-fns.
   * @param date The date to format
   * @returns The formatted date string
   */
  public formatNgbDate(date: NgbDateStruct): string {
    return format(ngbDateToDate(date), 'yyyy-MM-dd');
  }
}

