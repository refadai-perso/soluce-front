import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { LocaleService } from '../../services/locale.service';
import { AuthService } from '../../services/auth.service';

/**
 * Component for user authentication/login functionality.
 * 
 * @remarks
 * - Provides a login form with email and password fields.
 * - Handles user authentication via {@link AuthService}.
 * - Navigates to dashboard upon successful login.
 * - Displays error messages for failed authentication attempts.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent {
  private readonly localeService: LocaleService = inject(LocaleService);
  private readonly authService: AuthService = inject(AuthService);

  /**
   * Reactive form group containing email and password controls.
   */
  public form: FormGroup<{
    emailCtrl: FormControl<string | null>;
    passwordCtrl: FormControl<string | null>;
  }> = new FormGroup<{
    emailCtrl: FormControl<string | null>;
    passwordCtrl: FormControl<string | null>;
  }>({
    emailCtrl: new FormControl<string | null>('', [Validators.required, Validators.email]),
    passwordCtrl: new FormControl<string | null>('', [Validators.required])
  });

  /**
   * Indicates whether the form submission is in progress.
   */
  public isSubmitting: boolean = false;

  /**
   * Error message to display if authentication fails.
   */
  public errorMessage: string | null = null;

  constructor() {}

  /**
   * Handles form submission and authenticates the user.
   * On success, navigates to the dashboard.
   */
  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const emailValue: string | null = this.form.controls.emailCtrl.value;
    const passwordValue: string | null = this.form.controls.passwordCtrl.value;

    if (emailValue === null || passwordValue === null) {
      this.isSubmitting = false;
      this.errorMessage = $localize`Email and password are required`;
      return;
    }

    const email: string = emailValue;
    const password: string = passwordValue;

    this.authService.signIn(email, password).pipe(
      catchError((error: unknown) => {
        this.isSubmitting = false;
        this.errorMessage = error instanceof Error ? error.message : $localize`Failed to sign in`;
        return throwError(() => error);
      })
    ).subscribe(() => {
      this.isSubmitting = false;
      void this.localeService.navigateWithLocale(['dashboard']);
    });
  }
}
