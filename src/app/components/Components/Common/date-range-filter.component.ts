/**
 * Standalone component for date range filtering.
 * Provides a reusable date range picker with preset options.
 */

import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbDropdownModule, NgbDatepickerModule, NgbDateStruct, NgbDropdown, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { format, isAfter, isBefore, isEqual } from 'date-fns';
import {
  ngbDateToDate,
  dateToNgbDate
} from '../../../utils/date-sort-utils';

interface DateRangePreset {
  label: string;
  icon: string;
  getValue: () => { from: Date; to: Date };
}

export interface DateRangeChange {
  from: string;
  to: string;
}

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  templateUrl: './date-range-filter.component.html',
  styleUrls: ['./date-range-filter.component.scss'],
  imports: [CommonModule, NgbDropdownModule, NgbDatepickerModule]
})
export class DateRangeFilterComponent implements OnInit {
  /**
   * Initial from date in YYYY-MM-DD format.
   */
  @Input() public initialFromDate: string = '';

  /**
   * Initial to date in YYYY-MM-DD format.
   */
  @Input() public initialToDate: string = '';

  /**
   * Emits date range changes with from and to dates in YYYY-MM-DD format.
   */
  @Output() public dateRangeChange: EventEmitter<DateRangeChange> = new EventEmitter<DateRangeChange>();

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

  /**
   * Initializes the component with input dates.
   */
  public ngOnInit(): void {
    if (this.initialFromDate) {
      const fromDate: Date = new Date(this.initialFromDate);
      this.fromDate = dateToNgbDate(fromDate);
    }
    if (this.initialToDate) {
      const toDate: Date = new Date(this.initialToDate);
      this.toDate = dateToNgbDate(toDate);
    }
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
   * @param dropdown The dropdown instance to close
   */
  public applyPreset(preset: DateRangePreset, dropdown?: NgbDropdown): void {
    const range: { from: Date; to: Date } = preset.getValue();
    this.fromDate = dateToNgbDate(range.from);
    this.toDate = dateToNgbDate(range.to);
    this.applyDateRange();
    if (dropdown) {
      setTimeout(() => dropdown.close(), 300);
    }
  }

  /**
   * Applies the selected date range to the filter.
   */
  private applyDateRange(): void {
    const fromDateStr: string = this.fromDate ? format(ngbDateToDate(this.fromDate), 'yyyy-MM-dd') : '';
    const toDateStr: string = this.toDate ? format(ngbDateToDate(this.toDate), 'yyyy-MM-dd') : '';
    
    this.dateRangeChange.emit({
      from: fromDateStr,
      to: toDateStr
    });
  }

  /**
   * Clears the date range filter.
   * @param dropdown The dropdown instance to close
   */
  public clearDateRange(dropdown?: NgbDropdown): void {
    this.fromDate = null;
    this.toDate = null;
    this.dateRangeChange.emit({
      from: '',
      to: ''
    });
    if (dropdown) {
      setTimeout(() => dropdown.close(), 300);
    }
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
      // Date range format: YYYY-MM-DD - YYYY-MM-DD (universal format, no translation needed)
      return `${this.formatNgbDate(this.fromDate)} - ${this.formatNgbDate(this.toDate)}`;
    }
    if (this.fromDate) {
      // Concatenate localized "From" with date (date format is universal YYYY-MM-DD)
      const fromDateStr: string = this.formatNgbDate(this.fromDate);
      return $localize`From` + ` ${fromDateStr}`;
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

