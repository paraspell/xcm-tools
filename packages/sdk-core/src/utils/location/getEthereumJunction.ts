import { isExternalChain, type TChain, type TJunctionGlobalConsensus } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ETH_MAINNET_PARA_ID, ETH_TESTNET_PARA_ID } from '../../constants'

export const getEthereumJunction = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TChain | TCustomChain,
  useBigInt = true
): TJunctionGlobalConsensus => {
  const relayChain = isExternalChain(chain) ? undefined : api.getRelayChainOf(chain)
  const isTestnet = relayChain === 'Westend' || relayChain === 'Paseo'
  const chainId = isTestnet ? ETH_TESTNET_PARA_ID : ETH_MAINNET_PARA_ID
  return {
    GlobalConsensus: {
      Ethereum: { chainId: useBigInt ? BigInt(chainId) : chainId }
    }
  }
}
