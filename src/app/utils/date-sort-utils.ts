/**
 * Essential date utility functions for Angular Bootstrap integration
 * Provides conversions between NgbDateStruct and JavaScript Date
 */

import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

/**
 * Converts NgbDateStruct to JavaScript Date object
 * @param ngbDate The NgbDateStruct to convert
 * @returns JavaScript Date object
 */
export function ngbDateToDate(ngbDate: NgbDateStruct): Date {
  return new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day);
}

/**
 * Converts JavaScript Date object to NgbDateStruct
 * @param date The Date to convert
 * @returns NgbDateStruct object
 */
export function dateToNgbDate(date: Date): NgbDateStruct {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}
