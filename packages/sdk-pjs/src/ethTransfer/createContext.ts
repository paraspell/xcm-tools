import type { environment } from '@snowbridge/api'
import { Context } from '@snowbridge/api'
import type { AbstractProvider } from 'ethers'

export const createContext = (
  executionUrl: string | AbstractProvider,
  config: environment.Config
) =>
  new Context({
    ethereum: {
      execution_url: executionUrl,
      beacon_url: config.BEACON_HTTP_API
    },
    polkadot: {
      assetHubParaId: config.ASSET_HUB_PARAID,
      bridgeHubParaId: config.BRIDGE_HUB_PARAID,
      relaychain: config.RELAY_CHAIN_URL,
      parachains: config.PARACHAINS
    },
    appContracts: {
      gateway: config.GATEWAY_CONTRACT,
      beefy: config.BEEFY_CONTRACT
    }
  })
