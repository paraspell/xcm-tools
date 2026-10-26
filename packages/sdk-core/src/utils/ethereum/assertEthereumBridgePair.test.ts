import { describe, expect, it } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { assertEthereumBridgePair } from './assertEthereumBridgePair'

describe('assertEthereumBridgePair', () => {
  it('allows Ethereum mainnet destinations', () => {
    expect(() => assertEthereumBridgePair('Ethereum', 'AssetHubPolkadot')).not.toThrow()
    expect(() => assertEthereumBridgePair('Ethereum', 'Hydration')).not.toThrow()
    expect(() => assertEthereumBridgePair('Ethereum', 'BifrostPolkadot')).not.toThrow()
    expect(() => assertEthereumBridgePair('Ethereum', 'Mythos')).not.toThrow()
  })

  it('allows EthereumTestnet destinations', () => {
    expect(() => assertEthereumBridgePair('EthereumTestnet', 'AssetHubWestend')).not.toThrow()
    expect(() => assertEthereumBridgePair('EthereumTestnet', 'AssetHubPaseo')).not.toThrow()
  })

  it.each(['AssetHubWestend', 'AssetHubPaseo', 'AssetHubKusama'] as const)(
    'rejects Ethereum to %s before a mainnet paraId would be assumed',
    destination => {
      expect(() => assertEthereumBridgePair('Ethereum', destination)).toThrow(
        ScenarioNotSupportedError
      )
      expect(() => assertEthereumBridgePair('Ethereum', destination)).toThrow(
        new RegExp(`Transfers from Ethereum to ${destination} are not supported`)
      )
    }
  )

  it('rejects mismatched EthereumTestnet pairs', () => {
    expect(() => assertEthereumBridgePair('EthereumTestnet', 'AssetHubPolkadot')).toThrow(
      /Transfers from EthereumTestnet to AssetHubPolkadot are not supported/
    )
    expect(() => assertEthereumBridgePair('EthereumTestnet', 'AssetHubKusama')).toThrow(
      ScenarioNotSupportedError
    )
    expect(() => assertEthereumBridgePair('EthereumTestnet', 'Hydration')).toThrow(
      /Supported destinations: AssetHubPaseo, AssetHubWestend/
    )
  })

  it('rejects a non-Ethereum origin', () => {
    expect(() => assertEthereumBridgePair('Acala', 'AssetHubPolkadot')).toThrow(
      /only supported from Ethereum or EthereumTestnet/
    )
  })
})
