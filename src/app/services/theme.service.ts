import { Injectable } from '@angular/core';

/**
 * Service for managing Bootstrap theme switching.
 * 
 * @remarks
 * - Supports 'light' and 'dark' themes.
 * - Persists theme preference in localStorage.
 * - Applies theme to the HTML element via data-bs-theme attribute.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY: string = 'bootstrap-theme';
  private readonly DEFAULT_THEME: 'light' | 'dark' = 'dark';

  /**
   * Gets the current theme.
   * 
   * @returns The current theme ('light' or 'dark').
   */
  public getCurrentTheme(): 'light' | 'dark' {
    const storedTheme: string | null = localStorage.getItem(this.THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return this.DEFAULT_THEME;
  }

  /**
   * Sets the theme and applies it to the document.
   * 
   * @param theme The theme to set ('light' or 'dark').
   */
  public setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.THEME_STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  /**
   * Toggles between light and dark themes.
   * 
   * @returns The new theme after toggling.
   */
  public toggleTheme(): 'light' | 'dark' {
    const currentTheme: 'light' | 'dark' = this.getCurrentTheme();
    const newTheme: 'light' | 'dark' = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Initializes the theme on application startup.
   * Should be called during app initialization.
   */
  public initializeTheme(): void {
    const theme: 'light' | 'dark' = this.getCurrentTheme();
    this.applyTheme(theme);
  }

  /**
   * Applies the theme to the HTML element.
   * 
   * @param theme The theme to apply.
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    const htmlElement: HTMLElement = document.documentElement;
    htmlElement.setAttribute('data-bs-theme', theme);
  }
}
