/**
 * Type definitions for process.env variables loaded from .env files via webpack.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * When set to 'true', enables automatic authentication at app startup.
     * Set in .env.development, .env.prod, or .env.test files.
     */
    AUTOMATIC_AUTHENTICATION?: string;
    /**
     * Environment identifier: 'development', 'prod', or 'test'.
     */
    ENV?: string;
  }
}

