import { InvalidCurrencyError } from '@paraspell/assets'
import { hasJunction, type TMultiLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { DOT_MULTILOCATION } from '../../../constants'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'

vi.mock('@paraspell/sdk-common', async importActual => {
  const actual = await importActual<typeof import('@paraspell/sdk-common')>()
  return {
    ...actual,
    hasJunction: vi.fn()
  }
})

vi.mock('./getAssetHubMultiLocation', () => ({
  getAssetHubMultiLocation: vi.fn()
}))

describe('getBalanceForeignPolkadotXcm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return balance for Mythos node', async () => {
    const mockApi = {
      getMythosForeignBalance: vi.fn().mockResolvedValue(1000n)
    } as unknown as IPolkadotApi<unknown, unknown>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'Mythos', 'some-address', {
      symbol: 'DOT',
      assetId: '1'
    })

    expect(result).toBe(1000n)
  })

  it('should return balance for Polimec node', async () => {
    const mockApi = {
      getBalanceForeignAssetsPallet: vi.fn().mockResolvedValue(200n)
    } as unknown as IPolkadotApi<unknown, unknown>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'Polimec', 'some-address', {
      symbol: 'DOT',
      multiLocation: { foo: 'bar' } as unknown as TMultiLocation
    })

    expect(result).toBe(200n)
  })

  it('Polimec - throws if multiLocation missing', async () => {
    const api = {} as unknown as IPolkadotApi<unknown, unknown>

    await expect(
      getBalanceForeignPolkadotXcm(api, 'Polimec', 'addr', { symbol: 'DOT', assetId: '1' })
    ).rejects.toThrow(InvalidCurrencyError)
  })

  it('should return balance for Moonbeam node', async () => {
    const mockApi = {
      getBalanceAssetsPallet: vi.fn().mockResolvedValue(300n)
    } as unknown as IPolkadotApi<unknown, unknown>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'Moonbeam', 'some-address', {
      symbol: 'DOT',
      assetId: '1'
    })

    expect(result).toBe(300n)
  })

  it('should return balance for Moonriver node', async () => {
    const mockApi = {
      getBalanceAssetsPallet: vi.fn().mockResolvedValue(400n)
    } as unknown as IPolkadotApi<unknown, unknown>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'Moonriver', 'some-address', {
      symbol: 'DOT',
      assetId: '1'
    })

    expect(result).toBe(400n)
  })

  it('Moonbeam - throws if assetId missing', async () => {
    const api = {} as unknown as IPolkadotApi<unknown, unknown>

    await expect(
      getBalanceForeignPolkadotXcm(api, 'Moonbeam', 'addr', { symbol: 'DOT', isNative: true })
    ).rejects.toThrow(InvalidCurrencyError)
  })

  it('Moonriver - should throw error if asset is not foreign', async () => {
    const mockApi = {} as unknown as IPolkadotApi<unknown, unknown>

    await expect(
      getBalanceForeignPolkadotXcm(mockApi, 'Moonriver', 'some-address', {
        symbol: 'DOT',
        isNative: true
      })
    ).rejects.toThrowError(InvalidCurrencyError)
  })

  it('AssetHubPolkadot -> no multiLocation - uses getBalanceAssetsPallet', async () => {
    const api = {
      getBalanceAssetsPallet: vi.fn().mockResolvedValue(111n),
      getBalanceForeignAssetsPallet: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    const spyAssetsPallet = vi.spyOn(api, 'getBalanceAssetsPallet')
    const spyForeignAssetsPallet = vi.spyOn(api, 'getBalanceForeignAssetsPallet')

    const res = await getBalanceForeignPolkadotXcm(api, 'AssetHubPolkadot', 'addr', {
      symbol: 'DOT',
      assetId: '42'
    })

    expect(res).toBe(111n)
    expect(spyAssetsPallet).toHaveBeenCalledWith('addr', 42)
    expect(spyForeignAssetsPallet).not.toHaveBeenCalled()
  })

  it('AssetHubPolkadot -> has palletInstance=50 & generalIndex - uses getBalanceAssetsPallet', async () => {
    vi.mocked(hasJunction).mockImplementation(
      (_, kind) => kind === 'PalletInstance' || kind === 'GeneralIndex'
    )

    const api = {
      getBalanceAssetsPallet: vi.fn().mockResolvedValue(222n),
      getBalanceForeignAssetsPallet: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    const ml = {} as TMultiLocation

    const spyAssetsPallet = vi.spyOn(api, 'getBalanceAssetsPallet')
    const spyForeignAssetsPallet = vi.spyOn(api, 'getBalanceForeignAssetsPallet')

    const res = await getBalanceForeignPolkadotXcm(api, 'AssetHubPolkadot', 'addr', {
      symbol: 'DOT',
      assetId: '4242',
      multiLocation: ml
    })

    expect(res).toBe(222n)
    expect(spyAssetsPallet).toHaveBeenCalledWith('addr', 4242)
    expect(spyForeignAssetsPallet).not.toHaveBeenCalled()
  })

  it('AssetHubPolkadot -> multiLocation without required junctions - uses getBalanceForeignAssetsPallet', async () => {
    vi.mocked(hasJunction).mockReturnValue(false)

    const ml = DOT_MULTILOCATION

    const api = {
      getBalanceForeignAssetsPallet: vi.fn().mockResolvedValue(333n),
      getBalanceAssetsPallet: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    const spyAssetsPallet = vi.spyOn(api, 'getBalanceAssetsPallet')
    const spyForeignAssetsPallet = vi.spyOn(api, 'getBalanceForeignAssetsPallet')

    const res = await getBalanceForeignPolkadotXcm(api, 'AssetHubPolkadot', 'addr', {
      symbol: 'DOT',
      assetId: '7',
      multiLocation: ml
    })

    expect(res).toBe(333n)
    expect(spyForeignAssetsPallet).toHaveBeenCalledWith('addr', ml)
    expect(spyAssetsPallet).not.toHaveBeenCalled()
  })
})
