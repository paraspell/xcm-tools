import type { TChain } from '@paraspell/sdk-common'

/**
 * Used to inform user, that Parachain they wish to use has not yet implemented full XCM Support
 */
export class NoXCMSupportImplementedError extends Error {
  /**
   * Constructs a new NoXCMSupportImplementedError.
   *
   * @param chain - The chain for which XCM support is not implemented.
   */
  constructor(chain: TChain) {
    super(`No XCM support implemented for chain ${chain} yet.`)
    this.name = 'NoXCMSupportImplemented'
  }
}
