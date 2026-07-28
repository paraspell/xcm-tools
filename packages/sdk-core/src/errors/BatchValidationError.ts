import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when a batch operation is invalid or cannot be executed.
 */
export class BatchValidationError extends ParaSpellError {
  constructor(message: string) {
    super(message)
  }
}
