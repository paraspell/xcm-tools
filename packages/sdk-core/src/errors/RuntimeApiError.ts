/**
 * Error thrown when a runtime API call fails
 */
export class RuntimeApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RuntimeApiError'
  }
}
