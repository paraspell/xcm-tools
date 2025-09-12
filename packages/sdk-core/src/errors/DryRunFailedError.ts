import type { TChain } from '@paraspell/sdk-common'

type TDryRunType = 'origin' | 'destination' | 'assetHub' | 'bridgeHub' | TChain

/**
 * Error thrown when the Dry Run fails.
 */
export class DryRunFailedError extends Error {
  public readonly reason: string
  public readonly dryRunType?: TDryRunType

  /**
   * Constructs a new DryRunFailedError.
   *
   * @param reason - The reason why the dry run failed.
   * @param dryRunType - Optional. Specifies if the error is related to the 'origin' or 'destination' dry run.
   */
  constructor(reason: string, dryRunType?: TDryRunType) {
    let message = `Dry run failed: ${reason}`
    if (dryRunType) {
      message = `Dry run on ${dryRunType} failed: ${reason}`
    }
    super(message)
    this.name = 'DryRunFailedError'
    this.reason = reason
    this.dryRunType = dryRunType
  }
}
