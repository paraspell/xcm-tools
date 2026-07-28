import { ParaSpellError } from '@paraspell/sdk-common'

/**
 * UnableToComputeError is thrown when a computation cannot be performed.
 */
export class UnableToComputeError extends ParaSpellError {
  /**
   * Constructs a new UnableToComputeError.
   *
   * @param message - Required error message.
   */
  constructor(message: string) {
    super(message)
  }
}
