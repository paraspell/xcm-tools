import { isAssetEqual, type TAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { isNativeAssetTeleport } from './isNativeAssetTeleport'

vi.mock('@paraspell/assets', async importActual => ({
  ...(await importActual()),
  isAssetEqual: vi.fn()
}))

describe('isNativeAssetTeleport', () => {
  const nativeAsset = { symbol: 'GLMR', location: { parents: 1, interior: 'Here' } } as TAssetInfo
  const asset = { symbol: 'GLMR', location: { parents: 1, interior: 'Here' } } as TAssetInfo

  const findNativeAssetInfoOrThrow = vi.fn()
  const getRelayChainOf = vi.fn()
  const api = {
    findNativeAssetInfoOrThrow,
    getRelayChainOf
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    findNativeAssetInfoOrThrow.mockReturnValue(nativeAsset)
    getRelayChainOf.mockReturnValue('Polkadot')
  })

  it('returns false when neither side is AssetHub', () => {
    expect(isNativeAssetTeleport(api, 'Darwinia', 'BifrostPolkadot', asset)).toBe(false)
    expect(findNativeAssetInfoOrThrow).not.toHaveBeenCalled()
  })

  it('returns false when both sides are AssetHub', () => {
    expect(isNativeAssetTeleport(api, 'AssetHubPolkadot', 'AssetHubKusama', asset)).toBe(false)
  })

  it('returns false for an external chain', () => {
    expect(isNativeAssetTeleport(api, 'AssetHubPolkadot', 'Ethereum', asset)).toBe(false)
    expect(findNativeAssetInfoOrThrow).not.toHaveBeenCalled()
  })

  it('checks the origin native asset for parachain -> AssetHub', () => {
    vi.mocked(isAssetEqual).mockReturnValue(true)
    expect(isNativeAssetTeleport(api, 'Darwinia', 'AssetHubPolkadot', asset)).toBe(true)
    expect(findNativeAssetInfoOrThrow).toHaveBeenCalledWith('Darwinia')
  })

  it('checks the dest native asset for AssetHub -> parachain', () => {
    vi.mocked(isAssetEqual).mockReturnValue(true)
    expect(isNativeAssetTeleport(api, 'AssetHubPolkadot', 'Darwinia', asset)).toBe(true)
    expect(findNativeAssetInfoOrThrow).toHaveBeenCalledWith('Darwinia')
  })

  it('returns false when the Asset Hub and native parachain are on different relay chains', () => {
    getRelayChainOf.mockImplementation(chain => (chain === 'Basilisk' ? 'Kusama' : 'Polkadot'))
    vi.mocked(isAssetEqual).mockReturnValue(true)

    expect(isNativeAssetTeleport(api, 'AssetHubPolkadot', 'Basilisk', asset)).toBe(false)
    expect(findNativeAssetInfoOrThrow).not.toHaveBeenCalled()
    expect(isAssetEqual).not.toHaveBeenCalled()
  })

  it.each([
    ['Curio', 'AssetHubKusama'],
    ['AssetHubKusama', 'Curio']
  ] as const)('returns false for Curio native asset teleport from %s to %s', (origin, dest) => {
    getRelayChainOf.mockReturnValue('Kusama')
    vi.mocked(isAssetEqual).mockReturnValue(true)

    expect(isNativeAssetTeleport(api, origin, dest, asset)).toBe(false)
    expect(findNativeAssetInfoOrThrow).not.toHaveBeenCalled()
    expect(isAssetEqual).not.toHaveBeenCalled()
  })

  it('returns false when the asset is not the parachain native', () => {
    vi.mocked(isAssetEqual).mockReturnValue(false)
    expect(isNativeAssetTeleport(api, 'Darwinia', 'AssetHubPolkadot', asset)).toBe(false)
  })
})
