import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { CreateUserDto } from '@shared/dto/user/create-user.dto';
import { LocaleService } from '../../services/locale.service';
import { UserService } from '../../services/user.service';

/**
 * Component for user account creation/signup functionality.
 * 
 * @remarks
 * - Provides a signup form with email, first name, surname, and password fields.
 * - Handles user account creation via {@link UserService}.
 * - All new users are created as regular users (admin: false).
 * - Navigates to welcome page upon successful account creation.
 * - Displays error messages for failed account creation attempts.
 */
@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class SignupComponent {
  private readonly localeService: LocaleService = inject(LocaleService);
  private readonly userService: UserService = inject(UserService);

  /**
   * Reactive form group containing email, first name, surname, and password controls.
   */
  public form: FormGroup<{
    emailCtrl: FormControl<string | null>;
    firstNameCtrl: FormControl<string | null>;
    surnameCtrl: FormControl<string | null>;
    passwordCtrl: FormControl<string | null>;
  }> = new FormGroup<{
    emailCtrl: FormControl<string | null>;
    firstNameCtrl: FormControl<string | null>;
    surnameCtrl: FormControl<string | null>;
    passwordCtrl: FormControl<string | null>;
  }>({
    emailCtrl: new FormControl<string | null>('', [Validators.required, Validators.email]),
    firstNameCtrl: new FormControl<string | null>('', [Validators.required, Validators.minLength(2)]),
    surnameCtrl: new FormControl<string | null>('', [Validators.required, Validators.minLength(2)]),
    passwordCtrl: new FormControl<string | null>('', [Validators.required, Validators.minLength(6)])
  });

  /**
   * Indicates whether the form submission is in progress.
   */
  public isSubmitting: boolean = false;

  /**
   * Error message to display if account creation fails.
   */
  public errorMessage: string | null = null;

  constructor() {}

  /**
   * Handles form submission and creates a new user account.
   * On success, navigates to the welcome page.
   */
  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const emailValue: string | null = this.form.controls.emailCtrl.value;
    const firstNameValue: string | null = this.form.controls.firstNameCtrl.value;
    const surnameValue: string | null = this.form.controls.surnameCtrl.value;
    const passwordValue: string | null = this.form.controls.passwordCtrl.value;

    if (emailValue === null || firstNameValue === null || surnameValue === null || passwordValue === null) {
      this.isSubmitting = false;
      this.errorMessage = $localize`All fields are required`;
      return;
    }

    const createUserDto: CreateUserDto = {
      email: emailValue,
      firstName: firstNameValue,
      surname: surnameValue,
      password: passwordValue,
      admin: false
    };

    this.userService.createUser(createUserDto).pipe(
      catchError((error: unknown) => {
        this.isSubmitting = false;
        this.errorMessage = error instanceof Error ? error.message : $localize`Failed to create account`;
        return throwError(() => error);
      })
    ).subscribe(() => {
      this.isSubmitting = false;
      void this.localeService.navigateWithLocale([]);
    });
  }
}
