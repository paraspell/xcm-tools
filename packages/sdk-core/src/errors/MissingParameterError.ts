/**
 * Error thrown when a required parameter is missing.
 */
export class MissingParameterError extends Error {
  constructor(parameter: string | string[], message?: string) {
    const label = Array.isArray(parameter) ? parameter.join(', ') : parameter
    super(message ?? `Missing required parameter: ${label}.`)
    this.name = 'MissingParameterError'
  }
}
