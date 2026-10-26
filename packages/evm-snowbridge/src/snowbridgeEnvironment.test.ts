import { ScenarioNotSupportedError } from '@paraspell/sdk-core'
import { describe, expect, it } from 'vitest'

import { ethereumWsUrlsFor, snowbridgeEnvironmentFor } from './snowbridgeEnvironment'
import { ETHEREUM_TESTNET_WS_URLS, ETHEREUM_WS_URLS } from './viemClientCache'

describe('snowbridgeEnvironmentFor', () => {
  it('selects polkadot_mainnet for an Ethereum origin', () => {
    expect(snowbridgeEnvironmentFor('Ethereum', 'AssetHubPolkadot')).toBe('polkadot_mainnet')
    expect(snowbridgeEnvironmentFor('Ethereum', 'Hydration')).toBe('polkadot_mainnet')
    expect(snowbridgeEnvironmentFor('Ethereum', 'Mythos')).toBe('polkadot_mainnet')
  })

  it('selects the Sepolia environment that matches the EthereumTestnet destination', () => {
    expect(snowbridgeEnvironmentFor('EthereumTestnet', 'AssetHubWestend')).toBe('westend_sepolia')
    expect(snowbridgeEnvironmentFor('EthereumTestnet', 'AssetHubPaseo')).toBe('paseo_sepolia')
  })

  it('rejects an EthereumTestnet destination that has no Snowbridge environment', () => {
    expect(() => snowbridgeEnvironmentFor('EthereumTestnet', 'AssetHubPolkadot')).toThrow(
      ScenarioNotSupportedError
    )
    expect(() => snowbridgeEnvironmentFor('EthereumTestnet', 'AssetHubKusama')).toThrow(
      /No Snowbridge environment is configured/
    )
  })
})

describe('ethereumWsUrlsFor', () => {
  it('uses mainnet endpoints for polkadot_mainnet and Sepolia endpoints otherwise', () => {
    expect(ethereumWsUrlsFor('polkadot_mainnet')).toBe(ETHEREUM_WS_URLS)
    expect(ethereumWsUrlsFor('westend_sepolia')).toBe(ETHEREUM_TESTNET_WS_URLS)
    expect(ethereumWsUrlsFor('paseo_sepolia')).toBe(ETHEREUM_TESTNET_WS_URLS)
  })
})
