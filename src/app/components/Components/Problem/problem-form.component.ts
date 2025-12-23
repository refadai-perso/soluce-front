/**
 * Problem form component that provides a strongly-typed reactive form
 * to create or edit a {@link Problem} entity.
 *
 * @remarks
 * - Designed as a standalone Angular 19 component.
 * - Suitable for embedding inside a wizard by enabling {@link ProblemFormComponent#wizardMode}.
 * - Emits debounced change events and a final submit event with a fully typed value.
 *
 * @example
 * ```html
 * <app-problem-form
 *   [initialValue]="problem"
 *   [wizardMode]="true"
 *   (changed)="onStepChanged($event)"
 *   (submitProblem)="onSave($event)"
 * ></app-problem-form>
 * ```
 */
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { CreateProblemDto } from '@shared/dto';

import type { Problem } from '../../../model/model';
import { LocaleService } from '../../../services/locale.service';
import { ProblemService } from '../../../services/problem.service';

@Component({
  selector: 'app-problem-form',
  standalone: true,
  templateUrl: './problem-form.component.html',
  imports: [CommonModule, ReactiveFormsModule],
})
export class ProblemFormComponent implements OnInit, OnChanges {
  /**
   * Optional initial problem value to patch into the form.
   */
  @Input() initialValue: Problem | null = null;

  /**
   * When true, the component renders wizard-friendly hints and hides action buttons.
   */
  @Input() wizardMode: boolean = false;

  /**
   * When true and not in wizard mode, shows Reset/Cancel/Submit actions.
   */
  @Input() showActions: boolean = true;

  /**
   * Label for the primary submit button.
   */
  @Input() submitLabel: string = $localize`:@@save:Save`;

  /**
   * Emits the full {@link Problem} value on successful submit.
   */
  @Output() submitProblem: EventEmitter<Problem> = new EventEmitter<Problem>();

  /**
   * Emits when the user cancels the form (useful for dialogs/wizards).
   */
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Emits the current {@link Problem} (or null if invalid) on debounced changes.
   */
  @Output() changed: EventEmitter<Problem | null> = new EventEmitter<Problem | null>();

  /**
   * Suggested values for the `status` field.
   */
  readonly statusOptions: ReadonlyArray<string> = ['New', 'In Progress', 'Blocked', 'Resolved', 'Closed'];

  /**
   * Allowed values for the `open` string field.
   */
  readonly visibilityOptions: ReadonlyArray<string> = ['Public', 'Private'];

  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly router: Router = inject(Router);
  private readonly localeService: LocaleService = inject(LocaleService);
  private readonly problemService: ProblemService = inject(ProblemService);

  /**
   * Strongly-typed reactive form grouping all {@link Problem} fields.
   */
  form: FormGroup<{
    idCtrl: FormControl<number | null>;
    nameCtrl: FormControl<string | null>;
    descriptionCtrl: FormControl<string | null>;
    statusCtrl: FormControl<string | null>;
    visibilityCtrl: FormControl<string | null>;
    creationDateCtrl: FormControl<string | null>;
    creatorCtrl: FormControl<string | null>;
  }> = new FormGroup<{
    idCtrl: FormControl<number | null>;
    nameCtrl: FormControl<string | null>;
    descriptionCtrl: FormControl<string | null>;
    statusCtrl: FormControl<string | null>;
    visibilityCtrl: FormControl<string | null>;
    creationDateCtrl: FormControl<string | null>;
    creatorCtrl: FormControl<string | null>;
  }>({
    idCtrl: new FormControl<number | null>(null, { nonNullable: false }),
    nameCtrl: new FormControl<string | null>(null, { validators: [Validators.required, Validators.minLength(3)] }),
    descriptionCtrl: new FormControl<string | null>(null, { validators: [Validators.required, Validators.minLength(5)] }),
    statusCtrl: new FormControl<string | null>(null, { validators: [Validators.required] }),
    visibilityCtrl: new FormControl<string | null>('Private', { validators: [Validators.required] }),
    creationDateCtrl: new FormControl<string | null>(null, { validators: [Validators.required] }),
    creatorCtrl: new FormControl<string | null>(null, { validators: [Validators.required, Validators.minLength(2)] }),
  });

  /** @internal */
  ngOnInit(): void {
    this.patchFromInitial(this.initialValue);
    // Ensure creator and creation date are set from environment/session when missing
    const currentUserName: string = this.resolveCurrentUserName();
    const today: string = this.toHtmlDateString(new Date());
    if (this.form.controls.creatorCtrl.value === null || this.form.controls.creatorCtrl.value === '') {
      this.form.controls.creatorCtrl.setValue(currentUserName);
      this.form.controls.creatorCtrl.disable({ emitEvent: false });
    } else {
      this.form.controls.creatorCtrl.disable({ emitEvent: false });
    }
    if (this.form.controls.creationDateCtrl.value === null || this.form.controls.creationDateCtrl.value === '') {
      this.form.controls.creationDateCtrl.setValue(today, { emitEvent: false });
    }
    this.form.controls.creationDateCtrl.disable({ emitEvent: false });
    const sub: Subscription = this.form.valueChanges
      .pipe(debounceTime(200))
      .subscribe((value: Partial<{
        idCtrl: number | null;
        nameCtrl: string | null;
        descriptionCtrl: string | null;
        statusCtrl: string | null;
        visibilityCtrl: string | null;
        creationDateCtrl: string | null;
        creatorCtrl: string | null;
      }>): void => {
        const current: Problem | null = this.toProblemOrNull();
        this.changed.emit(current);
      });
    this.destroyRef.onDestroy((): void => sub.unsubscribe());
  }

  /** @internal */
  ngOnChanges(changes: SimpleChanges): void {
    const hasInitial: boolean = Object.prototype.hasOwnProperty.call(changes, 'initialValue');
    if (hasInitial === true) {
      this.patchFromInitial(this.initialValue);
    }
  }

  /**
   * Handles form submission and emits a fully typed {@link Problem}.
   */
  onSubmit(): void {
    if (this.form.invalid === true) {
      this.form.markAllAsTouched();
      return;
    }
    const rawName: string | null = this.form.controls.nameCtrl.value;
    const rawDescription: string | null = this.form.controls.descriptionCtrl.value;
    const rawVisibility: string | null = this.form.controls.visibilityCtrl.value;
    const body: CreateProblemDto = {
      name: rawName === null ? '' : rawName,
      description: rawDescription === null ? '' : rawDescription,
      open: (rawVisibility ?? 'Private') === 'Public',
    };
    console.log('Form submission body:', body);
    const sub: Subscription = this.problemService.createProblem(body).subscribe({
      next: (created: Problem): void => {
        this.submitProblem.emit(created);
        void this.localeService.navigateWithLocale(['dashboard']);
      },
      error: (_err: unknown): void => {
        // Keep simple UX for now; could surface an alert/Toast
        console.log('Create problem failed');
      },
    });
    this.destroyRef.onDestroy((): void => sub.unsubscribe());
  }

  /**
   * Resets the form to the last provided {@link Problem} initial value.
   */
  onReset(): void {
    this.form.reset();
    this.patchFromInitial(this.initialValue);
    const currentUserName: string = this.resolveCurrentUserName();
    const today: string = this.toHtmlDateString(new Date());
    this.form.controls.creatorCtrl.setValue(currentUserName, { emitEvent: false });
    this.form.controls.creatorCtrl.disable({ emitEvent: false });
    this.form.controls.creationDateCtrl.setValue(today, { emitEvent: false });
    this.form.controls.creationDateCtrl.disable({ emitEvent: false });
  }

  /**
   * Emits a cancel event for parent containers (dialogs/wizards).
   */
  onCancel(): void {
    // Clear validation state and avoid showing errors
    this.form.markAsPristine();
    this.form.markAsUntouched();
    const controlNames: Array<keyof typeof this.form.controls> = Object.keys(this.form.controls) as Array<keyof typeof this.form.controls>;
    for (const controlName of controlNames) {
      const control = this.form.controls[controlName];
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }
    this.cancel.emit();
    void this.localeService.navigateWithLocale(['dashboard']);
  }

  /**
   * Patch form fields from an initial {@link Problem} value.
   * @param value The initial problem; when null the method is no-op.
   */
  private patchFromInitial(value: Problem | null): void {
    if (value === null) {
      return;
    }
    const dateString: string | null = value.creationDate instanceof Date
      ? this.toHtmlDateString(value.creationDate)
      : null;
    this.form.patchValue({
      idCtrl: typeof value.id === 'number' ? value.id : null,
      nameCtrl: typeof value.name === 'string' ? value.name : null,
      descriptionCtrl: typeof value.description === 'string' ? value.description : null,
      statusCtrl: typeof value.status === 'string' ? value.status : null,
      visibilityCtrl: typeof value.open === 'string' ? value.open : 'Private',
      creationDateCtrl: dateString,
      creatorCtrl: typeof value.creator === 'string' ? value.creator : null,
    }, { emitEvent: false });
  }

  /**
   * Convert the current form value to a {@link Problem} object.
   * @returns A problem value with optional fields set when present.
   */
  private toProblem(): Problem {
    const rawId: number | null = this.form.controls.idCtrl.value;
    const rawName: string | null = this.form.controls.nameCtrl.value;
    const rawDescription: string | null = this.form.controls.descriptionCtrl.value;
    const rawStatus: string | null = this.form.controls.statusCtrl.value;
    const rawOpen: string | null = this.form.controls.visibilityCtrl.value;
    const rawCreationDate: string | null = this.form.controls.creationDateCtrl.value;
    const rawCreator: string | null = this.form.controls.creatorCtrl.value;

    const creationDate: Date | undefined = rawCreationDate !== null ? new Date(rawCreationDate as string) : undefined;

    const problem: Problem = {
      id: typeof rawId === 'number' ? rawId : undefined,
      name: rawName === null ? undefined : rawName,
      description: rawDescription === null ? undefined : rawDescription,
      status: rawStatus === null ? undefined : rawStatus,
      open: rawOpen === null ? undefined : rawOpen,
      creationDate: creationDate,
      creator: rawCreator === null ? undefined : rawCreator,
    };
    return problem;
  }

  /**
   * Convert the current form to a {@link Problem} if valid, otherwise null.
   */
  private toProblemOrNull(): Problem | null {
    if (this.form.valid !== true) {
      return null;
    }
    const p: Problem = this.toProblem();
    return p;
  }

  /**
   * Convert a Date to an HTML input date string (yyyy-MM-dd).
   * @param d The date to format.
   */
  private toHtmlDateString(d: Date): string {
    const year: number = d.getFullYear();
    const month: number = d.getMonth() + 1;
    const day: number = d.getDate();
    const mm: string = month < 10 ? '0' + String(month) : String(month);
    const dd: string = day < 10 ? '0' + String(day) : String(day);
    const s: string = String(year) + '-' + mm + '-' + dd;
    return s;
  }

  /**
   * Resolve current user's display name from a session/token mechanism.
   * Placeholder implementation using localStorage; replace with your auth service.
   */
  private resolveCurrentUserName(): string {
    const stored: string | null = window.localStorage.getItem('current-user-name');
    const value: string = stored === null || stored === '' ? 'Current User' : stored;
    return value;
  }
}
