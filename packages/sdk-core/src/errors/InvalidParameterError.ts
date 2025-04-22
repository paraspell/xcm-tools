/**
 * Error thrown when the Dry Run fails.
 */
export class InvalidParameterError extends Error {
  /**
   * Constructs a new InvalidParameterError.
   *
   * @param message - Required error message.
   */
  constructor(message: string) {
    super(message)
    this.name = 'InvalidParameterError'
  }
}
