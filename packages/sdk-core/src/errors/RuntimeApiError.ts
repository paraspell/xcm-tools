import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when a runtime API call fails
 */
export class RuntimeApiError extends ParaSpellError {
  constructor(message: string) {
    super(message)
  }
}
