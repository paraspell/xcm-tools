/**
 * Error thrown when the Dry Run fails.
 */
export class DryRunFailedError extends Error {
  /**
   * Constructs a new DryRunFailedError.
   *
   * @param message - Optional custom error message.
   */
  constructor(reason: string) {
    super(`Dry run failed: ${reason}`)
    this.name = 'DryRunFailedError'
  }
}
