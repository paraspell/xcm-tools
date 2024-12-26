/**
 * Error thrown when nodes from different relay chains are incompatible.
 */
export class IncompatibleNodesError extends Error {
  /**
   * Constructs a new IncompatibleNodesError.
   *
   * @param message - Optional custom error message.
   */
  constructor(message?: string) {
    super(message ?? 'Transactions between nodes on different relaychains are not yet possible.')
    this.name = 'IncompatibleNodes'
  }
}
