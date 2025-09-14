import { Injectable, signal, computed } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { 
  LocaleConfig, 
  LocaleServiceConfig, 
  SupportedLocaleCode, 
  LocaleNavigationCommand,
  LocaleNavigationOptions 
} from '../interfaces/locale-config.interface';

/**
 * Service for managing application locale and internationalization.
 * Provides reactive locale state management and utility functions.
 */
@Injectable({
  providedIn: 'root'
})
export class LocaleService {
  /**
   * Supported locales configuration.
   */
  private readonly localeConfig: LocaleServiceConfig = {
    supportedLocales: [
      { code: 'en-EN', displayName: 'English', language: 'en', country: 'EN' },
      { code: 'fr-FR', displayName: 'Français', language: 'fr', country: 'FR' }
    ] as const,
    defaultLocale: { code: 'en-EN', displayName: 'English', language: 'en', country: 'EN' }
  };

  /**
   * Supported locale codes.
   */
  readonly supportedLocales: ReadonlyArray<SupportedLocaleCode> = this.localeConfig.supportedLocales.map(locale => locale.code as SupportedLocaleCode);

  /**
   * Default locale code.
   */
  readonly defaultLocale: SupportedLocaleCode = this.localeConfig.defaultLocale.code as SupportedLocaleCode;

  /**
   * Current locale signal.
   */
  private readonly currentLocaleSignal = signal<SupportedLocaleCode>(this.defaultLocale);

  /**
   * Current locale as a computed signal.
   */
  readonly currentLocale = computed(() => this.currentLocaleSignal());

  /**
   * Current locale without country code (e.g., 'en' from 'en-EN').
   */
  readonly currentLanguage = computed(() => this.extractLanguage(this.currentLocale()));

  /**
   * Get locale configuration by code.
   * @param code The locale code.
   * @returns The locale configuration or undefined if not found.
   */
  getLocaleConfig(code: string): LocaleConfig | undefined {
    return this.localeConfig.supportedLocales.find(locale => locale.code === code);
  }

  constructor(private readonly router: Router) {
    this.initializeLocale();
  }

  /**
   * Set the current locale and update the URL accordingly.
   * @param locale The locale to set (e.g., 'en-EN', 'fr-FR').
   */
  setLocale(locale: string): void {
    if (this.isValidLocale(locale) === false) {
      console.warn(`Invalid locale: ${locale}. Using default locale: ${this.defaultLocale}`);
      locale = this.defaultLocale;
    }

    this.currentLocaleSignal.set(locale as SupportedLocaleCode);
    this.updateDocumentLanguage(locale);
  }

  /**
   * Get the current locale from the URL or return default.
   * @param urlSegments URL segments to extract locale from.
   * @returns The locale found in URL or default locale.
   */
  getLocaleFromUrl(urlSegments: string[]): SupportedLocaleCode {
    if (urlSegments.length === 0) {
      return this.defaultLocale;
    }

    const firstSegment: string = urlSegments[0];
    if (this.isValidLocale(firstSegment) === true) {
      return firstSegment as SupportedLocaleCode;
    }

    return this.defaultLocale;
  }

  /**
   * Check if a locale is valid/supported.
   * @param locale The locale to validate.
   * @returns True if the locale is supported, false otherwise.
   */
  isValidLocale(locale: string): locale is SupportedLocaleCode {
    return this.supportedLocales.includes(locale as SupportedLocaleCode);
  }

  /**
   * Get the URL path without the locale prefix.
   * @param urlSegments URL segments.
   * @returns URL segments without the locale prefix.
   */
  getPathWithoutLocale(urlSegments: string[]): string[] {
    if (urlSegments.length === 0) {
      return [];
    }

    const firstSegment: string = urlSegments[0];
    if (this.isValidLocale(firstSegment) === true) {
      return urlSegments.slice(1);
    }

    return urlSegments;
  }

  /**
   * Navigate to a route with the current locale.
   * @param commands Navigation commands.
   * @param extras Navigation extras.
   */
  navigateWithLocale(commands: ReadonlyArray<LocaleNavigationCommand>, extras?: NavigationExtras): Promise<boolean> {
    const locale: SupportedLocaleCode = this.currentLocale();
    const localizedCommands: LocaleNavigationCommand[] = [locale, ...commands];
    return this.router.navigate(localizedCommands, extras);
  }

  /**
   * Get the current URL with locale prefix.
   * @returns The current URL with locale prefix.
   */
  getCurrentUrlWithLocale(): string {
    const currentUrl: string = this.router.url;
    const locale: SupportedLocaleCode = this.currentLocale();
    
    // If URL already has locale, return as is
    if (currentUrl.startsWith(`/${locale}/`)) {
      return currentUrl;
    }

    // If URL starts with /, remove it and add locale
    const cleanUrl: string = currentUrl.startsWith('/') ? currentUrl.slice(1) : currentUrl;
    return `/${locale}/${cleanUrl}`;
  }

  /**
   * Initialize locale from browser or URL.
   */
  private initializeLocale(): void {
    // Try to get locale from current URL first
    const currentUrl: string = this.router.url;
    const urlSegments: string[] = currentUrl.split('/').filter(segment => segment.length > 0);
    const localeFromUrl: SupportedLocaleCode = this.getLocaleFromUrl(urlSegments);
    
    this.setLocale(localeFromUrl);
  }

  /**
   * Update the document language attribute.
   * @param locale The locale to set.
   */
  private updateDocumentLanguage(locale: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.extractLanguage(locale);
    }
  }

  /**
   * Extract language code from locale (e.g., 'en' from 'en-EN').
   * @param locale The full locale string.
   * @returns The language code.
   */
  private extractLanguage(locale: string): string {
    return locale.split('-')[0];
  }
}

