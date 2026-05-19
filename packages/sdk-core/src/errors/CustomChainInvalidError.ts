/**
 * Error thrown when a custom chain definition is missing required fields or
 * carries invalid values.
 */
export class CustomChainInvalidError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'CustomChainInvalid'
  }
}
