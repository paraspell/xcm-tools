import type { TAssetInfo } from '@paraspell/assets'
import { getOtherAssetsPallets } from '@paraspell/pallets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import type { BaseAssetsPallet } from '../../types'
import { isAssetSufficient } from './isAssetSufficient'

vi.mock('@paraspell/pallets')
vi.mock('../../pallets')

const api = {} as PolkadotApi<unknown, unknown, unknown>
const asset = { assetId: '31337', location: {} } as TAssetInfo

describe('isAssetSufficient', () => {
  const getAssetState = vi.fn()

  beforeEach(() => {
    vi.mocked(getOtherAssetsPallets).mockReturnValue(['Assets', 'ForeignAssets'])
    vi.mocked(getPalletInstance).mockReturnValue({ getAssetState } as unknown as BaseAssetsPallet)
  })

  it('returns true for native assets', async () => {
    await expect(
      isAssetSufficient(api, 'AssetHubPolkadot', { ...asset, isNative: true })
    ).resolves.toBe(true)
    expect(getAssetState).not.toHaveBeenCalled()
  })

  it('returns true when the chain has no other assets pallets', async () => {
    vi.mocked(getOtherAssetsPallets).mockReturnValue([])

    await expect(isAssetSufficient(api, 'Polkadot', asset)).resolves.toBe(true)
    expect(getAssetState).not.toHaveBeenCalled()
  })

  it.each([true, false])('returns the on-chain sufficiency (%s)', async isSufficient => {
    getAssetState.mockResolvedValue({ isSufficient })

    await expect(isAssetSufficient(api, 'AssetHubPolkadot', asset)).resolves.toBe(isSufficient)
    expect(getPalletInstance).toHaveBeenCalledWith('Assets')
    expect(getAssetState).toHaveBeenCalledWith(api, asset)
  })

  it('returns true when the asset is not registered', async () => {
    getAssetState.mockResolvedValue(undefined)

    await expect(isAssetSufficient(api, 'AssetHubPolkadot', asset)).resolves.toBe(true)
  })

  it('returns true when the asset state cannot be determined', async () => {
    getAssetState.mockRejectedValue(new Error('Query failed'))

    await expect(isAssetSufficient(api, 'AssetHubPolkadot', asset)).resolves.toBe(true)
  })
})
