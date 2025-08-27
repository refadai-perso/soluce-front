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

