import type { TChain, TExternalChain } from '@paraspell/sdk-core'
import { ScenarioNotSupportedError } from '@paraspell/sdk-core'

import { ETHEREUM_TESTNET_WS_URLS, ETHEREUM_WS_URLS } from './viemClientCache'

/**
 * Snowbridge registry environments accepted by `bridgeInfoFor`.
 * `polkadot_mainnet` is Ethereum mainnet. The Sepolia environments are
 * selected from the destination because both Westend and Paseo share
 * `EthereumTestnet` as their origin.
 */
export type TSnowbridgeEnvironment = 'polkadot_mainnet' | 'westend_sepolia' | 'paseo_sepolia'

const TESTNET_ENVIRONMENT_BY_DESTINATION: Partial<Record<TChain, TSnowbridgeEnvironment>> = {
  AssetHubWestend: 'westend_sepolia',
  AssetHubPaseo: 'paseo_sepolia'
}

export const snowbridgeEnvironmentFor = (
  from: TExternalChain,
  to: TChain
): TSnowbridgeEnvironment => {
  if (from === 'Ethereum') return 'polkadot_mainnet'

  const environment = TESTNET_ENVIRONMENT_BY_DESTINATION[to]
  if (!environment) {
    throw new ScenarioNotSupportedError(
      `No Snowbridge environment is configured for transfers from ${from} to ${to}.`
    )
  }

  return environment
}

export const ethereumWsUrlsFor = (environment: TSnowbridgeEnvironment): string[] =>
  environment === 'polkadot_mainnet' ? ETHEREUM_WS_URLS : ETHEREUM_TESTNET_WS_URLS
