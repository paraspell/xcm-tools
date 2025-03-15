import { ETH_CHAIN_ID, getParaId } from '@paraspell/sdk-core'
import { Context } from '@snowbridge/api'
import type { SnowbridgeEnvironment } from '@snowbridge/api/dist/environment'
import type { AbstractProvider } from 'ethers'

export const createContext = (
  executionUrl: string | AbstractProvider,
  env: SnowbridgeEnvironment
) => {
  const config = env.config
  return new Context({
    environment: env.name,
    ethereum: {
      ethChainId: env.ethChainId,
      ethChains: {
        [ETH_CHAIN_ID.toString()]: executionUrl,
        [getParaId('Moonbeam')]: 'https://rpc.api.moonbeam.network'
      },
      beacon_url: config.BEACON_HTTP_API
    },
    polkadot: {
      assetHubParaId: config.ASSET_HUB_PARAID,
      bridgeHubParaId: config.BRIDGE_HUB_PARAID,
      parachains: config.PARACHAINS,
      relaychain: config.RELAY_CHAIN_URL
    },
    appContracts: {
      gateway: config.GATEWAY_CONTRACT,
      beefy: config.BEEFY_CONTRACT
    }
  })
}
