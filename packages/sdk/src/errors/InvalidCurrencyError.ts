/**
 * Used to inform user, that currency they wish to use is not registered on either origin or destination Parachain
 */
export class InvalidCurrencyError extends Error {
  /**
   * Constructs a new InvalidCurrencyError.
   *
   * @param message - The error message.
   */
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCurrencyError'
  }
}
