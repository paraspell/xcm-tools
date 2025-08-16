import type { TChain } from '@paraspell/sdk-common'

import { ETH_PARA_ID } from '../../constants'
import { getChainConfig } from './getChainConfig'

/**
 * Retrieves the parachain ID for a specified chain.
 *
 * @param chain - The chain for which to get the paraId.
 * @returns The parachain ID of the chain.
 */
export const getParaId = (chain: TChain): number => {
  if (chain === 'Ethereum') {
    return ETH_PARA_ID
  }

  return getChainConfig(chain).paraId
}
