import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * Error thrown when an operation or parameter combination is not supported.
 */
export class UnsupportedOperationError extends ParaSpellError {
  constructor(message: string) {
    super(message)
  }
}
