import { ParaSpellError, type TSubstrateChain } from '@paraspell/sdk-common'

/**
 * Used to inform user, that no XCM pallet was found on the specified chain.
 */
export class XcmPalletNotFoundError<TCustomChain extends string = never> extends ParaSpellError {
  /**
   * Constructs a new XcmPalletNotFoundError.
   *
   * @param chain - The chain for which no XCM pallet was found.
   */
  constructor(chain: TSubstrateChain | TCustomChain) {
    super(`No XCM pallet found on chain ${chain}`)
  }
}
