/**
 * UnableToComputeError is thrown when a computation cannot be performed.
 */
export class UnableToComputeError extends Error {
  /**
   * Constructs a new UnableToComputeError.
   *
   * @param message - Required error message.
   */
  constructor(message: string) {
    super(message)
    this.name = 'UnableToComputeError'
  }
}
