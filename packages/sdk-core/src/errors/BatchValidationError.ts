/**
 * Error thrown when a batch operation is invalid or cannot be executed.
 */
export class BatchValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BatchValidationError'
  }
}
