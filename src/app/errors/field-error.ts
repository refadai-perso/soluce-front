/**
 * A field-level error used by forms to display precise feedback.
 */
export interface FieldError {
  /**
   * Field or control name (e.g., `email`, `password`).
   */
  readonly field: string;
  /**
   * Human-readable validation message for the field.
   */
  readonly message: string;
}

