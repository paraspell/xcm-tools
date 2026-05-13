import { isExternalChain, type TChain, type TJunctionGlobalConsensus } from '@paraspell/sdk-common'

import { ETH_MAINNET_PARA_ID, ETH_TESTNET_PARA_ID } from '../../constants'
import { getRelayChainOf } from '../chain'

export const getEthereumJunction = (chain: TChain, useBigInt = true): TJunctionGlobalConsensus => {
  const relayChain = !isExternalChain(chain) ? getRelayChainOf(chain) : undefined
  const isTestnet = relayChain === 'Westend' || relayChain === 'Paseo'
  const chainId = isTestnet ? ETH_TESTNET_PARA_ID : ETH_MAINNET_PARA_ID
  return {
    GlobalConsensus: {
      Ethereum: { chainId: useBigInt ? BigInt(chainId) : chainId }
    }
  }
}
