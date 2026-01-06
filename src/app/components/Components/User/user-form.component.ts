/**
 * User form component that provides a strongly-typed reactive form
 * to create or edit a {@link User} entity.
 *
 * @remarks
 * - Designed as a standalone Angular 19 component.
 * - Suitable for embedding inside a modal by enabling {@link UserFormComponent#wizardMode}.
 * - Emits debounced change events and a final submit event with a fully typed value.
 *
 * @example
 * ```html
 * <app-user-form
 *   [initialValue]="user"
 *   [wizardMode]="true"
 *   (changed)="onStepChanged($event)"
 *   (submitUser)="onSave($event)"
 * ></app-user-form>
 * ```
 */
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';

import type { User } from '../../../model/model';
import { LocaleService } from '../../../services/locale.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  templateUrl: './user-form.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class UserFormComponent implements OnInit, OnChanges {
  /**
   * Optional initial user value to patch into the form.
   */
  @Input() initialValue: User | null = null;

  /**
   * When true, the component renders wizard-friendly hints and hides action buttons.
   */
  @Input() wizardMode: boolean = false;

  /**
   * When true and not in wizard mode, shows Reset/Cancel/Submit actions.
   */
  @Input() showActions: boolean = true;

  /**
   * When true, the form is in edit mode and will update an existing user.
   */
  @Input() isEditMode: boolean = false;

  /**
   * Label for the primary submit button.
   */
  @Input() submitLabel: string = $localize`:@@save:Save`;

  /**
   * Emits the full {@link User} value on successful submit.
   */
  @Output() submitUser: EventEmitter<User> = new EventEmitter<User>();

  /**
   * Emits when the user cancels the form (useful for dialogs/wizards).
   */
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Emits the current {@link User} (or null if invalid) on debounced changes.
   */
  @Output() changed: EventEmitter<User | null> = new EventEmitter<User | null>();

  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly router: Router = inject(Router);
  private readonly localeService: LocaleService = inject(LocaleService);
  private readonly userService: UserService = inject(UserService);

  /**
   * Strongly-typed reactive form grouping all {@link User} fields.
   */
  form: FormGroup<{
    idCtrl: FormControl<number | null>;
    emailCtrl: FormControl<string | null>;
    firstNameCtrl: FormControl<string | null>;
    surnameCtrl: FormControl<string | null>;
    passwordCtrl: FormControl<string | null>;
    adminCtrl: FormControl<boolean | null>;
  }> = new FormGroup<{
    idCtrl: FormControl<number | null>;
    emailCtrl: FormControl<string | null>;
    firstNameCtrl: FormControl<string | null>;
    surnameCtrl: FormControl<string | null>;
    passwordCtrl: FormControl<string | null>;
    adminCtrl: FormControl<boolean | null>;
  }>({
    idCtrl: new FormControl<number | null>(null, { nonNullable: false }),
    emailCtrl: new FormControl<string | null>(null, { validators: [Validators.required, Validators.email] }),
    firstNameCtrl: new FormControl<string | null>(null, { validators: [Validators.required, Validators.minLength(2)] }),
    surnameCtrl: new FormControl<string | null>(null, { validators: [Validators.required, Validators.minLength(2)] }),
    passwordCtrl: new FormControl<string | null>(null, { validators: [Validators.required, Validators.minLength(6)] }),
    adminCtrl: new FormControl<boolean | null>(false, { nonNullable: false }),
  });

  /** @internal */
  ngOnInit(): void {
    this.patchFromInitial(this.initialValue);
    // In edit mode, password is optional
    if (this.isEditMode) {
      this.form.controls.passwordCtrl.clearValidators();
      this.form.controls.passwordCtrl.updateValueAndValidity();
    }
    // Ensure form is ready before subscribing
    if (this.form && this.form.valueChanges) {
      const sub: Subscription = this.form.valueChanges
        .pipe(debounceTime(200))
        .subscribe((value: Partial<{
          idCtrl: number | null;
          emailCtrl: string | null;
          firstNameCtrl: string | null;
          surnameCtrl: string | null;
          passwordCtrl: string | null;
          adminCtrl: boolean | null;
        }>): void => {
          try {
            const current: User | null = this.toUserOrNull();
            this.changed.emit(current);
          } catch (error: unknown) {
            console.error('Error in form valueChanges subscription:', error);
          }
        });
      this.destroyRef.onDestroy((): void => sub.unsubscribe());
    }
  }

  /** @internal */
  ngOnChanges(changes: SimpleChanges): void {
    const hasInitial: boolean = Object.prototype.hasOwnProperty.call(changes, 'initialValue');
    if (hasInitial === true) {
      this.patchFromInitial(this.initialValue);
    }
  }

  /**
   * Handles form submission and emits a fully typed {@link User}.
   */
  onSubmit(): void {
    if (this.form.invalid === true) {
      this.form.markAllAsTouched();
      return;
    }
    const rawEmail: string | null = this.form.controls.emailCtrl.value;
    const rawFirstName: string | null = this.form.controls.firstNameCtrl.value;
    const rawSurname: string | null = this.form.controls.surnameCtrl.value;
    const rawPassword: string | null = this.form.controls.passwordCtrl.value;
    const rawAdmin: boolean | null = this.form.controls.adminCtrl.value;
    const rawId: number | null = this.form.controls.idCtrl.value;

    if (this.isEditMode && rawId !== null) {
      // Update existing user
      const updateData: { email?: string; firstName?: string; surname?: string; password?: string; admin?: boolean } = {};
      if (rawEmail !== null && rawEmail !== '') {
        updateData.email = rawEmail;
      }
      if (rawFirstName !== null && rawFirstName !== '') {
        updateData.firstName = rawFirstName;
      }
      if (rawSurname !== null && rawSurname !== '') {
        updateData.surname = rawSurname;
      }
      if (rawPassword !== null && rawPassword !== '') {
        updateData.password = rawPassword;
      }
      if (rawAdmin !== null) {
        updateData.admin = rawAdmin;
      }
      console.log('Form update data:', updateData);

      const sub: Subscription = this.userService.updateUser(rawId, updateData as any).subscribe({
        next: (updated: User): void => {
          console.log('User updated successfully:', updated);
          this.submitUser.emit(updated);
          // Only navigate if we're showing actions (standalone mode, not in a modal)
          if (this.showActions) {
            void this.localeService.navigateWithLocale(['user-management']);
          }
        },
        error: (_err: unknown): void => {
          // Keep simple UX for now; could surface an alert/Toast
          console.log('Update user failed');
        },
      });
      this.destroyRef.onDestroy((): void => sub.unsubscribe());
    } else {
      // Create new user
      if (rawPassword === null || rawPassword === '') {
        this.form.controls.passwordCtrl.markAsTouched();
        return;
      }
      const createData: { email: string; firstName: string; surname: string; password: string; admin: boolean } = {
        email: rawEmail === null ? '' : rawEmail,
        firstName: rawFirstName === null ? '' : rawFirstName,
        surname: rawSurname === null ? '' : rawSurname,
        password: rawPassword,
        admin: rawAdmin !== null ? rawAdmin : false,
      };
      console.log('Form submission data:', createData);

      const sub: Subscription = this.userService.createUser(createData as any).subscribe({
        next: (created: User): void => {
          console.log('User created successfully:', created);
          this.submitUser.emit(created);
          // Only navigate if we're showing actions (standalone mode, not in a modal)
          if (this.showActions) {
            void this.localeService.navigateWithLocale(['user-management']);
          }
        },
        error: (_err: unknown): void => {
          // Keep simple UX for now; could surface an alert/Toast
          console.log('Create user failed');
        },
      });
      this.destroyRef.onDestroy((): void => sub.unsubscribe());
    }
  }

  /**
   * Resets the form to the last provided {@link User} initial value.
   */
  onReset(): void {
    this.form.reset();
    this.patchFromInitial(this.initialValue);
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
    // Only navigate if we're showing actions (standalone mode, not in a modal)
    if (this.showActions) {
      void this.localeService.navigateWithLocale(['user-management']);
    }
  }

  /**
   * Patch form fields from an initial {@link User} value.
   * @param value The initial user; when null the method is no-op.
   */
  private patchFromInitial(value: User | null): void {
    if (value === null) {
      return;
    }
    this.form.patchValue({
      idCtrl: typeof value.id === 'number' ? value.id : null,
      emailCtrl: typeof value.email === 'string' ? value.email : null,
      firstNameCtrl: typeof value.firstName === 'string' ? value.firstName : null,
      surnameCtrl: typeof value.surname === 'string' ? value.surname : null,
      passwordCtrl: null, // Never patch password for security
      adminCtrl: typeof value.admin === 'boolean' ? value.admin : false,
    }, { emitEvent: false });
    // In edit mode, password is optional
    if (this.isEditMode) {
      this.form.controls.passwordCtrl.clearValidators();
      this.form.controls.passwordCtrl.updateValueAndValidity();
    }
  }

  /**
   * Convert the current form value to a {@link User} object.
   * @returns A user value with optional fields set when present.
   */
  private toUser(): User {
    const rawId: number | null = this.form.controls.idCtrl.value;
    const rawEmail: string | null = this.form.controls.emailCtrl.value;
    const rawFirstName: string | null = this.form.controls.firstNameCtrl.value;
    const rawSurname: string | null = this.form.controls.surnameCtrl.value;
    const rawAdmin: boolean | null = this.form.controls.adminCtrl.value;

    const user: User = {
      id: typeof rawId === 'number' ? rawId : undefined,
      email: rawEmail === null ? undefined : rawEmail,
      firstName: rawFirstName === null ? undefined : rawFirstName,
      surname: rawSurname === null ? undefined : rawSurname,
      admin: rawAdmin === null ? undefined : rawAdmin,
    };
    return user;
  }

  /**
   * Convert the current form to a {@link User} if valid, otherwise null.
   */
  private toUserOrNull(): User | null {
    if (this.form.valid !== true) {
      return null;
    }
    const u: User = this.toUser();
    return u;
  }
}

