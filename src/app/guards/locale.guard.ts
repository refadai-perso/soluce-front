import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { LocaleService } from '../services/locale.service';

/**
 * Guard that validates locale in the URL and redirects to default locale if invalid.
 * This guard ensures that only supported locales are accessible via URL.
 */
@Injectable({
  providedIn: 'root'
})
export class LocaleGuard implements CanActivate {
  private readonly localeService: LocaleService = inject(LocaleService);
  private readonly router: Router = inject(Router);
  private readonly localeId: string = inject(LOCALE_ID);

  /**
   * Check if the route can be activated based on locale validation.
   * @param route The activated route snapshot.
   * @param state The router state snapshot.
   * @returns True if the route can be activated, false otherwise.
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const urlSegments: string[] = state.url.split('/').filter(segment => segment.length > 0);
    
    // If no segments, redirect to default locale
    if (urlSegments.length === 0) {
      this.redirectToDefaultLocale();
      return false;
    }

    const locale: string = urlSegments[0];
    
    // If first segment is not a valid locale, redirect to default locale with current path
    if (this.localeService.isValidLocale(locale) === false) {
      this.redirectToDefaultLocaleWithPath(urlSegments);
      return false;
    }

    // Set the locale in the service
    this.localeService.setLocale(locale);
    
    return true;
  }

  /**
   * Redirect to default locale welcome page.
   */
  private redirectToDefaultLocale(): void {
    const defaultLocale: string = this.mapLocaleIdToCode(this.localeId);
    void this.router.navigate([`/${defaultLocale}`], { replaceUrl: true });
  }

  /**
   * Redirect to default locale with the current path.
   * @param urlSegments Current URL segments.
   */
  private redirectToDefaultLocaleWithPath(urlSegments: string[]): void {
    const defaultLocale: string = this.localeService.defaultLocale;
    const pathWithoutLocale: string[] = urlSegments;
    const redirectUrl: string[] = [defaultLocale, ...pathWithoutLocale];
    
    void this.router.navigate(redirectUrl, { replaceUrl: true });
  }

  private mapLocaleIdToCode(localeId: string): string {
    if ((localeId || '').toLowerCase().startsWith('fr')) {
      return 'fr';
    }
    return 'en-EN';
  }
}

