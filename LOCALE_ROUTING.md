# Locale-Based Routing Implementation

This document describes the implementation of locale-based routing in the Angular application, allowing URLs like `/fr-FR/problem-add` for French and `/en-EN/problem-add` for English.

## Overview

The application now supports static translation through URL-based locale routing. Each page can be accessed with a locale prefix to display content in the specified language.

## Features

- **URL-based locale routing**: `/en-EN/dashboard`, `/fr-FR/problem-add`, etc.
- **Automatic locale detection**: Invalid locales redirect to default locale
- **Locale switching**: Users can switch languages while maintaining current page
- **Static translation**: Pages are statically translated based on URL locale
- **Fallback handling**: Invalid routes redirect to default locale dashboard

## Supported Locales
  
- `fr-FR` - French

## URL Structure

```
/{locale}/{page}
```

Examples:
- `http://localhost:4200/en-EN/dashboard` - Dashboard in English
- `http://localhost:4200/fr-FR/problem-add` - Add Problem page in French
- `http://localhost:4200/en-EN/orders` - Orders page in English

## Implementation Details

### 1. Locale Service (`src/app/services/locale.service.ts`)

Manages current locale state and provides utility functions:
- `setLocale(locale: string)` - Set current locale
- `currentLocale` - Reactive signal for current locale
- `navigateWithLocale(commands: any[])` - Navigate with locale prefix
- `isValidLocale(locale: string)` - Validate locale

### 2. Locale Guard (`src/app/guards/locale.guard.ts`)

Validates locale in URL and handles redirections:
- Validates locale parameter in URL
- Redirects invalid locales to default locale
- Sets locale in LocaleService

### 3. Updated Routing (`src/app/app.routes.ts`)

Routes now support locale parameter:
```typescript
{
  path: ':locale',
  canActivate: [LocaleGuard],
  children: [
    { path: 'dashboard', component: DashboardComponent },
    { path: 'problem-add', component: ProblemAddComponent },
    // ... other routes
  ]
}
```

### 4. Locale Switcher Component

Dropdown component in header for switching languages:
- Shows current locale
- Allows switching between supported locales
- Maintains current page when switching

## Usage

### Development

Start the application with different locales:

```bash
# Default (English)
npm start

# English locale
npm run start:en

# French locale  
npm run start:fr
```

### Building

Build for specific locales:

```bash
# Build English version
npm run build:en

# Build French version
npm run build:fr

# Build all locales
npm run build:all
```

### Navigation in Code

Use the LocaleService for navigation:

```typescript
import { LocaleService } from './services/locale.service';

// Navigate to dashboard with current locale
this.localeService.navigateWithLocale(['dashboard']);

// Navigate to specific page with current locale
this.localeService.navigateWithLocale(['problem-add']);
```

### Adding New Locales

1. Add locale to `supportedLocales` in `LocaleService`
2. Add locale configuration in `angular.json`
3. Create translation file in `src/locale/`
4. Add build configuration in `angular.json`
5. Add npm script in `package.json`

## Translation Files

Translation files are located in `src/locale/`:
- `messages.xlf` - English (source locale)
- `messages.fr.xlf` - French translations

## URL Behavior

- `/` → redirects to `/en-EN/dashboard`
- `/invalid-locale/dashboard` → redirects to `/en-EN/dashboard`
- `/fr-FR/invalid-page` → redirects to `/en-EN/dashboard`
- `/en-EN/dashboard` → loads dashboard in English
- `/fr-FR/problem-add` → loads problem-add page in French

## Browser Support

The implementation works with:
- Modern browsers supporting Angular 19
- Server-side rendering (SSR) ready
- SEO-friendly URLs

## Troubleshooting

### Common Issues

1. **Locale not switching**: Check if LocaleService is properly injected
2. **Invalid locale redirects**: Ensure locale is in `supportedLocales` array
3. **Translation not showing**: Verify translation files are properly configured
4. **Build errors**: Check angular.json configuration for locale builds

### Debug Mode

Enable debug logging in LocaleService to troubleshoot issues:

```typescript
// In LocaleService constructor
console.log('Current locale:', this.currentLocale());
console.log('Supported locales:', this.supportedLocales);
```

## Future Enhancements

- Add more locales (Spanish, German, etc.)
- Implement locale detection from browser settings
- Add locale-specific date/number formatting
- Implement RTL language support
- Add locale-specific assets (images, styles)

