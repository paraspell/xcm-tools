import type { TDryRunFailure } from '../types'

/**
 * Error thrown when the Dry Run fails.
 */
export class DryRunFailedError<TCustomChain extends string = never> extends Error {
  readonly dryRunError: TDryRunFailure<TCustomChain>

  /**
   * Constructs a new DryRunFailedError.
   *
   * @param error - The dry-run error. Its `chain` marks which chain failed.
   * @param prefix - Optional. A short sentence prepended to the message.
   */
  constructor(error: TDryRunFailure<TCustomChain>, prefix?: string) {
    let message = `Dry run on ${error.chain} failed: ${error.reason}`
    if (prefix) {
      message = `${prefix} ${message}`
    }
    super(message)
    this.name = 'DryRunFailedError'
    this.dryRunError = error
  }
}
