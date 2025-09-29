# Soluce

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

Components are as followed:
- ./app.component.ts: the container of the main page
- Problem/problem-card: displays a list of problem as they are listed in the backend datastore
- Problem/problem-form: allow to add a single Problem in the datastore 
- Pages/dashboard.component.ts: the root dashboard. Will allow access to all other pages
- Pages/admin.component.ts: the admin page component
- Pages/find-problem-outlet.component.ts: the component that lists the Problem contained in the database
- Pages/problem-add.component.ts: the page that allow user to add a new Problem in the database

Models are as followed:
- in model/model.d.ts, interface Problem replicate the DTO contained in the backend to store a Problem

Services are as followed:
- services/problem.service.ts is the mock service that implements for example fetchProblemsOfUserGroups
- services/problem.service.mock-data.ts: is the constant list of objects retruned by the service above mentionned
- service/backend.service.ts: is the real service that will invoke the backend API to get or store object from/to the database

### documentation to add to cursor
Angular doc: https://angular.dev/overview
Angular Internationalization: https://angular.dev/guide/i18n
Bootstrap documentation: https://getbootstrap.com/docs/4.1/getting-started/introduction/


### documentation to add to cursor
Angular doc: https://angular.dev/overview
Angular Internationalization: https://angular.dev/guide/i18n
Bootstrap documentation: https://getbootstrap.com/docs/4.1/getting-started/introduction/

## Summary

I have successfully implemented locale-based routing for your Angular application! Here's what has been added:

### ✅ **Features Implemented**

1. **Locale-based URL routing**: 
   - `http://localhost:4200/en-EN/problem-add` - English version
   - `http://localhost:4200/fr-FR/problem-add` - French version

2. **Locale Service** (`src/app/services/locale.service.ts`):
   - Manages current locale state with Angular signals
   - Provides navigation utilities with locale support
   - Validates locales and handles fallbacks

3. **Locale Guard** (`src/app/guards/locale.guard.ts`):
   - Validates locale in URL parameters
   - Redirects invalid locales to default locale
   - Ensures only supported locales are accessible

4. **Updated Routing** (`src/app/app.routes.ts`):
   - All routes now support `:locale` parameter
   - Automatic redirection for invalid routes
   - Nested routing structure for clean URLs

5. **Locale Switcher Component**:
   - Dropdown in header for language switching
   - Maintains current page when switching languages
   - Shows current locale with proper display names

6. **Build Configuration**:
   - Multiple locale builds supported
   - NPM scripts for different locales
   - Production-ready configurations

### 🚀 **How to Use**

**Development:**
```bash
# Start with English (default)
npm start

# Start with French
npm run start:fr

# Start with English explicitly
npm run start:en
```

**Building:**
```bash
# Build English version
npm run build:en

# Build French version  
npm run build:fr

# Build all locales
npm run build:all
```

**URLs:**
- `http://localhost:4200/en-EN/dashboard` - Dashboard in English
- `http://localhost:4200/fr-FR/problem-add` - Add Problem page in French
- `http://localhost:4200/en-EN/orders` - Orders page in English

### 🔧 **Key Features**

- **Automatic redirection**: Invalid locales redirect to default locale
- **URL preservation**: Language switching maintains current page
- **Static translation**: Pages are statically translated based on URL
- **SEO-friendly**: Clean URLs with locale prefixes
- **Type-safe**: Full TypeScript support with proper typing

### 📁 **Files Created/Modified**

- ✅ `src/app/services/locale.service.ts` - Locale management service
- ✅ `src/app/guards/locale.guard.ts` - Locale validation guard
- ✅ `src/app/components/Components/locale-switcher.component.ts` - Language switcher
- ✅ `src/app/app.routes.ts` - Updated with locale routing
- ✅ `src/app/app.config.ts` - Added i18n providers
- ✅ `src/main.ts` - Locale detection on bootstrap
- ✅ `angular.json` - Multiple locale build configurations
- ✅ `package.json` - Added locale-specific scripts
- ✅ `LOCALE_ROUTING.md` - Complete documentation

The implementation follows Angular 19 best practices and is fully compatible with your existing JitBlox-generated code. The locale routing is now ready to use! 🎉
