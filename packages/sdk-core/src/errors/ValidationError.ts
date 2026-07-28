import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Thrown when a validation check fails.
 */
export class ValidationError extends ParaSpellError {
  constructor(message: string) {
    super(message)
  }
}
