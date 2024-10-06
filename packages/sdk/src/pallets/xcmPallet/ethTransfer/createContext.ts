import type { environment } from '@snowbridge/api'
import { contextFactory } from '@snowbridge/api'
import type { AbstractProvider } from 'ethers'

export const createContext = async (
  executionUrl: string | AbstractProvider,
  config: environment.Config
) => {
  return await contextFactory({
    ethereum: {
      execution_url: executionUrl,
      beacon_url: config.BEACON_HTTP_API
    },
    polkadot: {
      url: {
        bridgeHub: config.BRIDGE_HUB_URL,
        assetHub: config.ASSET_HUB_URL,
        relaychain: config.RELAY_CHAIN_URL,
        parachains: config.PARACHAINS
      }
    },
    appContracts: {
      gateway: config.GATEWAY_CONTRACT,
      beefy: config.BEEFY_CONTRACT
    }
  })
}
