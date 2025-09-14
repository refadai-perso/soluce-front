/**
 * Interface for locale configuration.
 */
export interface LocaleConfig {
  /**
   * The locale code (e.g., 'en-EN', 'fr-FR').
   */
  readonly code: string;

  /**
   * The display name for the locale (e.g., 'English', 'Français').
   */
  readonly displayName: string;

  /**
   * The language code without country (e.g., 'en', 'fr').
   */
  readonly language: string;

  /**
   * The country code (e.g., 'EN', 'FR').
   */
  readonly country: string;
}

/**
 * Interface for locale service configuration.
 */
export interface LocaleServiceConfig {
  /**
   * Supported locales in the application.
   */
  readonly supportedLocales: ReadonlyArray<LocaleConfig>;

  /**
   * Default locale for the application.
   */
  readonly defaultLocale: LocaleConfig;
}

/**
 * Type for supported locale codes.
 */
export type SupportedLocaleCode = 'en-EN' | 'fr-FR';

/**
 * Type for navigation commands with locale support.
 */
export type LocaleNavigationCommand = string | { [key: string]: string | number | boolean };

/**
 * Interface for locale-aware navigation.
 */
export interface LocaleNavigationOptions {
  /**
   * Navigation commands without locale prefix.
   */
  readonly commands: ReadonlyArray<LocaleNavigationCommand>;

  /**
   * Navigation extras.
   */
  readonly extras?: {
    readonly queryParams?: { [key: string]: string | number | boolean | null };
    readonly fragment?: string;
    readonly queryParamsHandling?: 'merge' | 'preserve' | '';
    readonly preserveFragment?: boolean;
    readonly skipLocationChange?: boolean;
    readonly replaceUrl?: boolean;
    readonly state?: { [key: string]: unknown };
  };
}

