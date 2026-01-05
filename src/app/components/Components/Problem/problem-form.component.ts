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
import { Component, DestroyRef, EventEmitter, Input, isDevMode, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { debounceTime, Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { CreateProblemDto, UpdateProblemDto } from '@shared/dto';
import { ProblemStatus } from '@shared/dto/problem/problem-status.enum';
import { Authorization } from '@shared/dto/group/authorization.enum';

import type { Problem } from '../../../model/model';
import { Group, GroupAuthorization } from '../../../model/model';
import { LocaleService } from '../../../services/locale.service';
import { ProblemService } from '../../../services/problem.service';
import { AuthService, DUMMY_USER_ID } from '../../../services/auth.service';
import { GroupService } from '../../../services/group.service';

@Component({
  selector: 'app-problem-form',
  standalone: true,
  templateUrl: './problem-form.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
   * When true, the form is in edit mode and will update an existing problem.
   */
  @Input() isEditMode: boolean = false;

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

  /**
   * List of group authorizations for this problem.
   */
  public groupAuthorizations: GroupAuthorization[] = [];

  /**
   * Whether the group authorizations accordion is expanded.
   */
  public groupAuthExpanded: boolean = false;

  /**
   * Whether the side panel for selecting groups is visible.
   */
  public groupSelectionPanelOpen: boolean = false;

  /**
   * Currently selected group in the side panel.
   */
  public selectedGroupForAdd: Group | null = null;

  /**
   * Selected authorization level in the side panel.
   */
  public selectedAuthLevelForAdd: Authorization = Authorization.READER;

  /**
   * Search filter for groups in the side panel.
   */
  public groupSearchFilter: string = '';

  /**
   * Available authorization levels.
   */
  public readonly authorizationLevels: ReadonlyArray<string> = [
    Authorization.ADMINISTRATOR,
    Authorization.CONTRIBUTOR,
    Authorization.READER
  ];

  /**
   * Available groups to select from (loaded from backend service).
   */
  public availableGroups: Group[] = [];

  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly router: Router = inject(Router);
  private readonly localeService: LocaleService = inject(LocaleService);
  private readonly problemService: ProblemService = inject(ProblemService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly groupService: GroupService = inject(GroupService);

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
    statusCtrl: new FormControl<string | null>('New', { validators: [Validators.required] }),
    visibilityCtrl: new FormControl<string | null>('Private', { validators: [Validators.required] }),
    creationDateCtrl: new FormControl<string | null>(null, { validators: [Validators.required] }),
    creatorCtrl: new FormControl<string | null>(null, { validators: [Validators.required, Validators.minLength(2)] }),
  });

  /** @internal */
  ngOnInit(): void {
    // Ensure groupAuthorizations is initialized before any operations
    if (this.groupAuthorizations === undefined || this.groupAuthorizations === null) {
      this.groupAuthorizations = [];
    }
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
    // Load available groups from backend service
    this.loadAvailableGroups();
    // Ensure form is ready before subscribing
    if (this.form && this.form.valueChanges) {
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
          try {
            const current: Problem | null = this.toProblemOrNull();
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
    const rawId: number | null = this.form.controls.idCtrl.value;
    const rawStatus: string | null = this.form.controls.statusCtrl.value;
    const rawCreationDate: string | null = this.form.controls.creationDateCtrl.value;

    if (this.isEditMode && rawId !== null) {
      // Update existing problem - use UpdateProblemDto
      const updateBody: UpdateProblemDto = {
        name: rawName ?? undefined,
        description: rawDescription ?? undefined,
        open: rawVisibility ? (rawVisibility === 'Public') : undefined,
        status: rawStatus ? (rawStatus as ProblemStatus) : undefined,
      };
      console.log('Form update body:', updateBody);

      const sub: Subscription = this.problemService.updateProblem(rawId, updateBody).subscribe({
        next: (updated: Problem): void => {
          this.submitProblem.emit(updated);
          // Only navigate if we're showing actions (standalone mode, not in a modal)
          if (this.showActions) {
            void this.localeService.navigateWithLocale(['dashboard']);
          }
        },
        error: (_err: unknown): void => {
          // Keep simple UX for now; could surface an alert/Toast
          console.log('Update problem failed');
        },
      });
      this.destroyRef.onDestroy((): void => sub.unsubscribe());
    } else {
      // Create new problem - use CreateProblemDto
      const currentUserId: number | null = this.authService.getCurrentUserId();
      let creatorId: number;
      if (currentUserId !== null) {
        creatorId = currentUserId;
      } else if (isDevMode()) {
        // In development mode, use dummy ID as fallback
        creatorId = DUMMY_USER_ID;
      } else {
        // In production mode, throw exception if user is not authenticated
        throw new Error('Cannot create problem: User must be authenticated. Please sign in before creating a problem.');
      }
      const createBody: CreateProblemDto = {
        name: rawName === null ? '' : rawName,
        description: rawDescription === null ? '' : rawDescription,
        open: (rawVisibility ?? 'Private') === 'Public',
        status: (rawStatus as ProblemStatus) || ProblemStatus.NEW,
        creatorId: creatorId,
        creationDate: rawCreationDate === null ? new Date().toISOString() : new Date(rawCreationDate).toISOString(),
      };
      console.log('Form submission body:', createBody);

      const sub: Subscription = this.problemService.createProblem(createBody).subscribe({
        next: (created: Problem): void => {
          this.submitProblem.emit(created);
          // Only navigate if we're showing actions (standalone mode, not in a modal)
          if (this.showActions) {
            void this.localeService.navigateWithLocale(['dashboard']);
          }
        },
        error: (_err: unknown): void => {
          // Keep simple UX for now; could surface an alert/Toast
          console.log('Create problem failed');
        },
      });
      this.destroyRef.onDestroy((): void => sub.unsubscribe());
    }
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
    if (this.initialValue?.groupAuthorizations) {
      this.groupAuthorizations = [...this.initialValue.groupAuthorizations];
    } else {
      this.groupAuthorizations = [];
    }
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
      void this.localeService.navigateWithLocale(['dashboard']);
    }
  }

  /**
   * Patch form fields from an initial {@link Problem} value.
   * @param value The initial problem; when null the method is no-op.
   */
  private patchFromInitial(value: Problem | null): void {
    // Ensure groupAuthorizations is always initialized
    if (this.groupAuthorizations === undefined || this.groupAuthorizations === null) {
      this.groupAuthorizations = [];
    }
    if (value === null) {
      this.groupAuthorizations = [];
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
      creatorCtrl: value.creator !== undefined && value.creator !== null 
        ? `${value.creator.firstName ?? ''} ${value.creator.surname ?? ''}`.trim() 
        : null,
    }, { emitEvent: false });
    if (value.groupAuthorizations && value.groupAuthorizations.length > 0) {
      this.groupAuthorizations = [...value.groupAuthorizations];
    } else {
      this.groupAuthorizations = [];
    }
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

    const creatorUser: { firstName?: string; surname?: string } | undefined = rawCreator !== null
      ? this.parseCreatorName(rawCreator)
      : undefined;

    const problem: Problem = {
      id: typeof rawId === 'number' ? rawId : undefined,
      name: rawName === null ? undefined : rawName,
      description: rawDescription === null ? undefined : rawDescription,
      status: rawStatus === null ? undefined : rawStatus,
      open: rawOpen === null ? undefined : rawOpen,
      creationDate: creationDate,
      creator: creatorUser,
      groupAuthorizations: (this.groupAuthorizations && this.groupAuthorizations.length > 0) ? this.groupAuthorizations : undefined,
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

  /**
   * Parse a full name string into firstName and surname.
   * Assumes the format "firstName surname" where the first word is firstName
   * and everything after is surname.
   * @param fullName The full name string to parse
   * @returns An object with firstName and surname properties
   */
  private parseCreatorName(fullName: string): { firstName?: string; surname?: string } {
    const trimmed: string = fullName.trim();
    if (trimmed === '') {
      return {};
    }
    const parts: string[] = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], surname: '' };
    }
    const firstName: string = parts[0];
    const surname: string = parts.slice(1).join(' ');
    return { firstName, surname };
  }

  /**
   * Returns the Bootstrap text color class based on authorization level.
   * @param authLevel The authorization level
   * @returns A Bootstrap text color class name
   */
  public getAuthorizationBadgeClass(authLevel: Authorization | undefined): string {
    switch (authLevel) {
      case Authorization.ADMINISTRATOR:
        return 'text-danger';
      case Authorization.CONTRIBUTOR:
        return 'text-warning';
      case Authorization.READER:
        return 'text-info';
      default:
        return 'text-secondary';
    }
  }

  /**
   * Returns a Bootstrap icon class for the authorization level.
   * @param authLevel The authorization level (string or Authorization enum)
   * @returns A Bootstrap icon class name
   */
  public getAuthorizationIcon(authLevel: Authorization | string | undefined): string {
    const level: string = typeof authLevel === 'string' ? authLevel : authLevel ?? '';
    switch (level) {
      case Authorization.ADMINISTRATOR:
      case 'ADMINISTRATOR':
        return 'bi-shield-fill-check';
      case Authorization.CONTRIBUTOR:
      case 'CONTRIBUTOR':
        return 'bi-pencil-fill';
      case Authorization.READER:
      case 'READER':
        return 'bi-eye-fill';
      default:
        return 'bi-question-circle';
    }
  }

  /**
   * Returns a human-readable label for the authorization level.
   * @param authLevel The authorization level
   * @returns A formatted label string
   */
  public getAuthorizationLabel(authLevel: Authorization | undefined): string {
    return authLevel || $localize`:@@unknown:Unknown`;
  }

  /**
   * Opens the side panel for selecting a group.
   */
  public onAddGroupAuthorization(): void {
    this.selectedGroupForAdd = null;
    this.selectedAuthLevelForAdd = Authorization.READER;
    this.groupSearchFilter = '';
    this.groupSelectionPanelOpen = true;
  }

  /**
   * Closes the side panel for selecting groups.
   */
  public onCloseGroupSelectionPanel(): void {
    this.groupSelectionPanelOpen = false;
    this.selectedGroupForAdd = null;
    this.groupSearchFilter = '';
  }

  /**
   * Filters available groups based on search term.
   * @returns Filtered list of groups
   */
  public getFilteredGroups(): Group[] {
    if (this.groupSearchFilter.trim() === '') {
      return this.availableGroups;
    }
    const filterLower: string = this.groupSearchFilter.toLowerCase();
    return this.availableGroups.filter((group: Group) => {
      const nameMatch: boolean = group.name?.toLowerCase().includes(filterLower) ?? false;
      const descMatch: boolean = group.description?.toLowerCase().includes(filterLower) ?? false;
      return nameMatch || descMatch;
    });
  }

  /**
   * Gets groups that are not already added to authorizations.
   * @returns Available groups that can be added
   */
  public getAvailableGroupsForSelection(): Group[] {
    const filtered: Group[] = this.getFilteredGroups();
    return filtered.filter((group: Group) => {
      const alreadyAdded: boolean = this.groupAuthorizations.some(
        (auth: GroupAuthorization) => auth.group?.id === group.id
      );
      return !alreadyAdded;
    });
  }

  /**
   * Handles selecting a group in the side panel.
   * @param group The group to select
   */
  public onSelectGroup(group: Group): void {
    this.selectedGroupForAdd = group;
  }

  /**
   * Handles adding the selected group with the selected authorization level.
   */
  public onConfirmAddSelectedGroup(): void {
    if (this.selectedGroupForAdd === null) {
      return;
    }
    const exists: boolean = this.groupAuthorizations.some(
      (auth: GroupAuthorization) => auth.group?.id === this.selectedGroupForAdd?.id
    );
    if (exists) {
      alert($localize`:@@groupAlreadyAdded:This group is already added`);
      return;
    }
    // Ensure we store the authorization level exactly as it appears in authorizationLevels array
    // This ensures proper matching in the dropdown
    const selectedStr: string = String(this.selectedAuthLevelForAdd);
    const authLevelToStore: Authorization = this.authorizationLevels.find(
      (level: string) => level === selectedStr || String(level) === selectedStr
    ) as Authorization || this.selectedAuthLevelForAdd;
    
    const newAuth: GroupAuthorization = {
      group: this.selectedGroupForAdd,
      authorizationLevel: authLevelToStore,
      grantedDate: new Date()
    };
    this.groupAuthorizations = [...this.groupAuthorizations, newAuth];
    this.onCloseGroupSelectionPanel();
  }

  /**
   * Handles removing a group authorization.
   * @param index The index of the authorization to remove
   */
  public onRemoveGroupAuthorization(index: number): void {
    this.groupAuthorizations = this.groupAuthorizations.filter((_, i: number) => i !== index);
  }

  /**
   * Loads available groups from the backend service.
   */
  private loadAvailableGroups(): void {
    const sub: Subscription = this.groupService.fetchGroups().subscribe({
      next: (groups: Group[]): void => {
        this.availableGroups = groups;
      },
      error: (error: unknown): void => {
        console.error('Error loading groups:', error);
        // Keep empty array on error - user will see "No groups found" message
        this.availableGroups = [];
      }
    });
    this.destroyRef.onDestroy((): void => sub.unsubscribe());
  }
}
