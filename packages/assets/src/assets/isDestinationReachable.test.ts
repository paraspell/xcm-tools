import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TCustomCtx } from '../types'
import { getRelayChainSymbolImpl } from './assets'
import { isDestinationReachable, isDestinationReachableImpl } from './isDestinationReachable'

vi.mock('./assets', () => ({
  getRelayChainSymbolImpl: vi.fn(() => 'DOT')
}))

describe('isDestinationReachable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRelayChainSymbolImpl).mockReturnValue('DOT')
  })

  it('should allow a substrate chain to reach its own external chain', () => {
    expect(isDestinationReachable('AssetHubPolkadot', 'Ethereum')).toBe(true)
    expect(isDestinationReachable('AssetHubPaseo', 'EthereumTestnet')).toBe(true)
  })

  it('should reject a substrate chain reaching an external chain of another ecosystem', () => {
    expect(isDestinationReachable('AssetHubPolkadot', 'EthereumTestnet')).toBe(false)
    expect(isDestinationReachable('AssetHubPaseo', 'Ethereum')).toBe(false)
  })

  it('should reject a substrate chain that bridges to no external chain', () => {
    expect(isDestinationReachable('Acala', 'Ethereum')).toBe(false)
  })

  it('should apply the same pairing when the origin is external', () => {
    expect(isDestinationReachable('Ethereum', 'AssetHubPolkadot')).toBe(true)
    expect(isDestinationReachable('Ethereum', 'AssetHubPaseo')).toBe(false)
    expect(isDestinationReachable('EthereumTestnet', 'AssetHubWestend')).toBe(true)
  })

  it('should reject external to external', () => {
    expect(isDestinationReachable('Ethereum', 'EthereumTestnet')).toBe(false)
  })

  it('should allow a supported substrate bridge across ecosystems', () => {
    vi.mocked(getRelayChainSymbolImpl).mockImplementation(chain =>
      chain === 'AssetHubPolkadot' ? 'DOT' : 'KSM'
    )

    expect(isDestinationReachable('AssetHubPolkadot', 'AssetHubKusama')).toBe(true)
    expect(isDestinationReachable('AssetHubPolkadot', 'AssetHubWestend')).toBe(false)
  })

  it('should compare relaychain symbols for substrate pairs', () => {
    vi.mocked(getRelayChainSymbolImpl).mockImplementation(chain =>
      chain === 'Astar' ? 'DOT' : 'KSM'
    )

    expect(isDestinationReachable('Astar', 'Karura')).toBe(false)
    expect(isDestinationReachable('Karura', 'Basilisk')).toBe(true)
  })

  it('should forward the custom context to the relaychain symbol lookup', () => {
    const ctx = { customAssets: {} } as TCustomCtx

    expect(isDestinationReachableImpl('Astar', 'Hydration', ctx)).toBe(true)
    expect(getRelayChainSymbolImpl).toHaveBeenCalledWith('Astar', ctx)
    expect(getRelayChainSymbolImpl).toHaveBeenCalledWith('Hydration', ctx)
  })
})
