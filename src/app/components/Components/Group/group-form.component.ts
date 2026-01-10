/**
 * Group form component that provides a strongly-typed reactive form
 * to create or edit a {@link Group} entity.
 *
 * @remarks
 * - Designed as a standalone Angular 19 component.
 * - Suitable for embedding inside a modal by enabling {@link GroupFormComponent#wizardMode}.
 * - Emits debounced change events and a final submit event with a fully typed value.
 *
 * @example
 * ```html
 * <app-group-form
 *   [initialValue]="group"
 *   [wizardMode]="true"
 *   (changed)="onStepChanged($event)"
 *   (submitGroup)="onSave($event)"
 * ></app-group-form>
 * ```
 */
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';

import type { Group } from '../../../model/model';
import { LocaleService } from '../../../services/locale.service';
import { GroupService } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-group-form',
  standalone: true,
  templateUrl: './group-form.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class GroupFormComponent implements OnInit, OnChanges {
  /**
   * Optional initial group value to patch into the form.
   */
  @Input() initialValue: Group | null = null;

  /**
   * When true, the component renders wizard-friendly hints and hides action buttons.
   */
  @Input() wizardMode: boolean = false;

  /**
   * When true and not in wizard mode, shows Reset/Cancel/Submit actions.
   */
  @Input() showActions: boolean = true;

  /**
   * When true, the form is in edit mode and will update an existing group.
   */
  @Input() isEditMode: boolean = false;

  /**
   * Label for the primary submit button.
   */
  @Input() submitLabel: string = $localize`:@@save:Save`;

  /**
   * Emits the full {@link Group} value on successful submit.
   */
  @Output() submitGroup: EventEmitter<Group> = new EventEmitter<Group>();

  /**
   * Emits when the user cancels the form (useful for dialogs/wizards).
   */
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Emits the current {@link Group} (or null if invalid) on debounced changes.
   */
  @Output() changed: EventEmitter<Group | null> = new EventEmitter<Group | null>();

  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly router: Router = inject(Router);
  private readonly localeService: LocaleService = inject(LocaleService);
  private readonly groupService: GroupService = inject(GroupService);
  private readonly authService: AuthService = inject(AuthService);

  /**
   * Strongly-typed reactive form grouping all {@link Group} fields.
   */
  form: FormGroup<{
    idCtrl: FormControl<number | null>;
    nameCtrl: FormControl<string | null>;
    descriptionCtrl: FormControl<string | null>;
  }> = new FormGroup<{
    idCtrl: FormControl<number | null>;
    nameCtrl: FormControl<string | null>;
    descriptionCtrl: FormControl<string | null>;
  }>({
    idCtrl: new FormControl<number | null>(null, { nonNullable: false }),
    nameCtrl: new FormControl<string | null>(null, { validators: [Validators.required, Validators.minLength(2)] }),
    descriptionCtrl: new FormControl<string | null>(null, { nonNullable: false }),
  });

  /** @internal */
  ngOnInit(): void {
    this.patchFromInitial(this.initialValue);
    // Ensure form is ready before subscribing
    if (this.form && this.form.valueChanges) {
      const sub: Subscription = this.form.valueChanges
        .pipe(debounceTime(200))
        .subscribe((value: Partial<{
          idCtrl: number | null;
          nameCtrl: string | null;
          descriptionCtrl: string | null;
        }>): void => {
          try {
            const current: Group | null = this.toGroupOrNull();
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
   * Handles form submission and emits a fully typed {@link Group}.
   */
  onSubmit(): void {
    if (this.form.invalid === true) {
      this.form.markAllAsTouched();
      return;
    }
    const rawName: string | null = this.form.controls.nameCtrl.value;
    const rawDescription: string | null = this.form.controls.descriptionCtrl.value;
    const rawId: number | null = this.form.controls.idCtrl.value;

    if (this.isEditMode && rawId !== null) {
      // Update existing group
      const updateData: { name?: string; description?: string } = {};
      if (rawName !== null && rawName !== '') {
        updateData.name = rawName;
      }
      if (rawDescription !== null && rawDescription !== '') {
        updateData.description = rawDescription;
      }
      console.log('Form update data:', updateData);

      const sub: Subscription = this.groupService.updateGroup(rawId, updateData as any).subscribe({
        next: (updated: Group): void => {
          console.log('Group updated successfully:', updated);
          this.submitGroup.emit(updated);
          // Only navigate if we're showing actions (standalone mode, not in a modal)
          if (this.showActions) {
            void this.localeService.navigateWithLocale(['group-management']);
          }
        },
        error: (_err: unknown): void => {
          // Keep simple UX for now; could surface an alert/Toast
          console.log('Update group failed');
        },
      });
      this.destroyRef.onDestroy((): void => sub.unsubscribe());
    } else {
      // Create new group
      if (rawName === null || rawName === '') {
        this.form.controls.nameCtrl.markAsTouched();
        return;
      }
      // Get current user ID for creatorId
      const currentUserId: number | null = this.authService.getCurrentUserId();
      if (currentUserId === null) {
        console.error('Cannot create group: No authenticated user found');
        // Could show an error message to the user here
        return;
      }

      const createData: { name: string; description?: string; creatorId: number } = {
        name: rawName,
        description: rawDescription === null ? undefined : rawDescription,
        creatorId: currentUserId
      };
      console.log('Form submission data:', createData);

      const sub: Subscription = this.groupService.createGroup(createData as any).subscribe({
        next: (created: Group): void => {
          console.log('Group created successfully:', created);
          this.submitGroup.emit(created);
          // Only navigate if we're showing actions (standalone mode, not in a modal)
          if (this.showActions) {
            void this.localeService.navigateWithLocale(['group-management']);
          }
        },
        error: (err: unknown): void => {
          console.error('Create group failed:', err);
          // Keep simple UX for now; could surface an alert/Toast
        },
      });
      this.destroyRef.onDestroy((): void => sub.unsubscribe());
    }
  }

  /**
   * Resets the form to the last provided {@link Group} initial value.
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
      void this.localeService.navigateWithLocale(['group-management']);
    }
  }

  /**
   * Patch form fields from an initial {@link Group} value.
   * @param value The initial group; when null the method is no-op.
   */
  private patchFromInitial(value: Group | null): void {
    if (value === null) {
      return;
    }
    this.form.patchValue({
      idCtrl: typeof value.id === 'number' ? value.id : null,
      nameCtrl: typeof value.name === 'string' ? value.name : null,
      descriptionCtrl: typeof value.description === 'string' ? value.description : null,
    }, { emitEvent: false });
  }

  /**
   * Convert the current form value to a {@link Group} object.
   * @returns A group value with optional fields set when present.
   */
  private toGroup(): Group {
    const rawId: number | null = this.form.controls.idCtrl.value;
    const rawName: string | null = this.form.controls.nameCtrl.value;
    const rawDescription: string | null = this.form.controls.descriptionCtrl.value;

    const group: Group = {
      id: typeof rawId === 'number' ? rawId : undefined,
      name: rawName === null ? undefined : rawName,
      description: rawDescription === null ? undefined : rawDescription,
    };
    return group;
  }

  /**
   * Convert the current form to a {@link Group} if valid, otherwise null.
   */
  private toGroupOrNull(): Group | null {
    if (this.form.valid !== true) {
      return null;
    }
    const g: Group = this.toGroup();
    return g;
  }
}

