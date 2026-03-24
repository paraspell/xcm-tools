/**
 * Error thrown when a submitted transaction encounters a dispatch error on-chain.
 */
export class SubmitTransactionError extends Error {
  /**
   * Constructs a new SubmitTransactionError.
   *
   * @param message - The dispatch error details.
   */
  constructor(message: string) {
    super(message)
    this.name = 'SubmitTransactionError'
  }
}
