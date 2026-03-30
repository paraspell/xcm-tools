import type { TSubstrateChain } from '@paraspell/sdk-common'

/**
 * Used to inform user, that no XCM pallet was found on the specified chain.
 */
export class XcmPalletNotFoundError extends Error {
  /**
   * Constructs a new XcmPalletNotFoundError.
   *
   * @param chain - The chain for which no XCM pallet was found.
   */
  constructor(chain: TSubstrateChain) {
    super(`No XCM pallet found on chain ${chain}`)
    this.name = 'XcmPalletNotFoundError'
  }
}
