import type { TDryRunFailure } from '../types'

/**
 * Error thrown when the Dry Run fails.
 */
export class DryRunFailedError extends Error {
  readonly dryRunError: TDryRunFailure

  /**
   * Constructs a new DryRunFailedError.
   *
   * @param error - The dry-run error. Its `chain`, when set, marks which chain failed.
   * @param prefix - Optional. A short sentence prepended to the message.
   */
  constructor(error: TDryRunFailure, prefix?: string) {
    let message = `Dry run failed: ${error.reason}`
    if (error.chain) {
      message = `Dry run on ${error.chain} failed: ${error.reason}`
    }
    if (prefix) {
      message = `${prefix} ${message}`
    }
    super(message)
    this.name = 'DryRunFailedError'
    this.dryRunError = error
  }
}
