/**
 * Error thrown when chains from different relay chains are incompatible.
 */
export class IncompatibleChainsError extends Error {
  /**
   * Constructs a new IncompatibleChainsError.
   *
   * @param message - Optional custom error message.
   */
  constructor(message?: string) {
    super(message ?? 'Transactions between chains on different relaychains are not yet possible.')
    this.name = 'IncompatibleChains'
  }
}
