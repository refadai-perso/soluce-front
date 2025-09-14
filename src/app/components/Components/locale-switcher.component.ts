import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LocaleService } from '../../services/locale.service';
import { SupportedLocaleCode, LocaleConfig } from '../../interfaces/locale-config.interface';

/**
 * Component for switching between different locales.
 * Provides a dropdown to change the application language.
 */
@Component({
  selector: 'app-locale-switcher',
  standalone: true,
  template: `
    <div class="dropdown">
      <button 
        class="btn btn-outline-secondary dropdown-toggle" 
        type="button" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
      >
        <i class="bi bi-globe me-1"></i>
        {{ getCurrentLocaleDisplayName() }}
      </button>
      <ul class="dropdown-menu">
        <li *ngFor="let locale of supportedLocales">
          <a 
            class="dropdown-item" 
            href="#" 
            (click)="switchLocale(locale, $event)"
            [class.active]="locale === currentLocale()"
          >
            {{ getLocaleDisplayName(locale) }}
          </a>
        </li>
      </ul>
    </div>
  `,
  imports: [CommonModule]
})
export class LocaleSwitcherComponent {
  private readonly localeService: LocaleService = inject(LocaleService);
  private readonly router: Router = inject(Router);

  /**
   * Supported locales in the application.
   */
  readonly supportedLocales: ReadonlyArray<SupportedLocaleCode> = this.localeService.supportedLocales;

  /**
   * Current locale signal.
   */
  readonly currentLocale = this.localeService.currentLocale;

  /**
   * Switch to a different locale.
   * @param locale The locale to switch to.
   * @param event The click event.
   */
  switchLocale(locale: SupportedLocaleCode, event: Event): void {
    event.preventDefault();
    
    if (locale === this.currentLocale()) {
      return;
    }

    // Get current route without locale
    const currentUrl: string = this.router.url;
    const urlSegments: string[] = currentUrl.split('/').filter(segment => segment.length > 0);
    const pathWithoutLocale: string[] = this.localeService.getPathWithoutLocale(urlSegments);
    
    // Navigate to the same route with new locale
    void this.localeService.navigateWithLocale(pathWithoutLocale);
  }

  /**
   * Get display name for a locale.
   * @param locale The locale code.
   * @returns The display name for the locale.
   */
  getLocaleDisplayName(locale: SupportedLocaleCode): string {
    const localeConfig: LocaleConfig | undefined = this.localeService.getLocaleConfig(locale);
    return localeConfig?.displayName || locale;
  }

  /**
   * Get display name for current locale.
   * @returns The display name for current locale.
   */
  getCurrentLocaleDisplayName(): string {
    return this.getLocaleDisplayName(this.currentLocale());
  }
}

