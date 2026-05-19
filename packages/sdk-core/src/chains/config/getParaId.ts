import type { TChain } from '@paraspell/sdk-common'

import { ETH_MAINNET_PARA_ID, ETH_TESTNET_PARA_ID } from '../../constants'
import type { TFullCustomCtx } from '../../types'
import { getChainConfigImpl } from './getChainConfig'

export const getParaIdImpl = (chain: TChain, ctx?: TFullCustomCtx): number => {
  if (chain === 'Ethereum') {
    return ETH_MAINNET_PARA_ID
  } else if (chain === 'EthereumTestnet') {
    return ETH_TESTNET_PARA_ID
  }

  return getChainConfigImpl(chain, ctx).paraId
}

/**
 * Retrieves the parachain ID for a specified chain.
 *
 * @param chain - The chain for which to get the paraId.
 * @returns The parachain ID of the chain.
 */
export const getParaId = (chain: TChain): number => getParaIdImpl(chain)
