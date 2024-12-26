/**
 * Error thrown when an invalid address is provided.
 */
export class InvalidAddressError extends Error {
  /**
   * Constructs a new InvalidAddressError.
   *
   * @param message - The error message.
   */
  constructor(message: string) {
    super(message)
    this.name = 'InvalidAddressError'
  }
}
