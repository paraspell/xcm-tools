/**
 * Error thrown when numeric input is invalid or cannot be parsed.
 */
export class NumberFormatError extends Error {
  constructor(message: string = 'Input must be a valid number') {
    super(message)
    this.name = 'NumberFormatError'
  }
}
