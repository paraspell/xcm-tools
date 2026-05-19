/**
 * Error thrown when a custom chain name collides with a built-in chain.
 */
export class CustomChainConflictError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'CustomChainConflict'
  }
}
