/**
 * Error thrown when an operation or parameter combination is not supported.
 */
export class UnsupportedOperationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedOperationError'
  }
}
