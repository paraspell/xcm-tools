import type { TChainEndpoint } from '../types'

/**
 * Error thrown when the Dry Run fails.
 */
export class DryRunFailedError extends Error {
  readonly reason: string
  readonly dryRunType?: TChainEndpoint

  /**
   * Constructs a new DryRunFailedError.
   *
   * @param reason - The reason why the dry run failed.
   * @param dryRunType - Optional. Specifies if the error is related to the 'origin' or 'destination' dry run.
   * @param prefix - Optional. A short sentence prepended to the message
   */
  constructor(reason: string, dryRunType?: TChainEndpoint, prefix?: string) {
    let message = `Dry run failed: ${reason}`
    if (dryRunType) {
      message = `Dry run on ${dryRunType} failed: ${reason}`
    }
    if (prefix) {
      message = `${prefix} ${message}`
    }
    super(message)
    this.name = 'DryRunFailedError'
    this.reason = reason
    this.dryRunType = dryRunType
  }
}
