import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when a required parameter is missing.
 */
export class MissingParameterError extends ParaSpellError {
  constructor(parameter: string | string[], message?: string) {
    const label = Array.isArray(parameter) ? parameter.join(', ') : parameter
    super(message ?? `Missing required parameter: ${label}.`)
  }
}
