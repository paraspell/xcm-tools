/**
 * Error thrown when asset or currency overrides are invalid or conflicting.
 */
export class OverrideConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OverrideConflictError'
  }
}
