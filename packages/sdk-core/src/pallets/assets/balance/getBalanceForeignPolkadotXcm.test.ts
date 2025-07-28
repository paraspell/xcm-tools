import { InvalidCurrencyError } from '@paraspell/assets'
import { hasJunction, type TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { DOT_LOCATION } from '../../../constants'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getMoonbeamErc20Balance } from './getMoonbeamErc20Balance'

vi.mock('@paraspell/sdk-common', async importActual => {
  const actual = await importActual<typeof import('@paraspell/sdk-common')>()
  return {
    ...actual,
    hasJunction: vi.fn()
  }
})

vi.mock('./getMoonbeamErc20Balance', () => ({
  getMoonbeamErc20Balance: vi.fn()
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
      location: { foo: 'bar' } as unknown as TLocation
    })

    expect(result).toBe(200n)
  })

  it('Polimec - throws if location missing', async () => {
    const api = {} as unknown as IPolkadotApi<unknown, unknown>

    await expect(
      getBalanceForeignPolkadotXcm(api, 'Polimec', 'addr', { symbol: 'DOT', assetId: '1' })
    ).rejects.toThrow(InvalidCurrencyError)
  })

  it('Moonbeam - uses getMoonbeamBalance', async () => {
    const MOONBEAM_BAL = 555n
    vi.mocked(getMoonbeamErc20Balance).mockResolvedValue(MOONBEAM_BAL)

    const api = {
      getBalanceAssetsPallet: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    const multiloc = {} as TLocation

    const spy = vi.spyOn(api, 'getBalanceAssetsPallet')

    const res = await getBalanceForeignPolkadotXcm(api, 'Moonbeam', 'addr', {
      symbol: 'DOT',
      assetId: '1234',
      location: multiloc
    })

    expect(res).toBe(MOONBEAM_BAL)
    expect(getMoonbeamErc20Balance).toHaveBeenCalledWith('Moonbeam', '1234', 'addr')
    expect(spy).not.toHaveBeenCalled()
  })

  it('should return balance for Moonriver node', async () => {
    const MOONBEAM_BAL = 555n
    vi.mocked(getMoonbeamErc20Balance).mockResolvedValue(MOONBEAM_BAL)

    const api = {
      getBalanceAssetsPallet: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    const multiloc = {} as TLocation

    const spy = vi.spyOn(api, 'getBalanceAssetsPallet')

    const res = await getBalanceForeignPolkadotXcm(api, 'Moonriver', 'addr', {
      symbol: 'DOT',
      assetId: '1234',
      location: multiloc
    })

    expect(res).toBe(MOONBEAM_BAL)
    expect(getMoonbeamErc20Balance).toHaveBeenCalledWith('Moonriver', '1234', 'addr')
    expect(spy).not.toHaveBeenCalled()
  })

  it('Moonbeam - throws if assetId missing', async () => {
    const api = {} as unknown as IPolkadotApi<unknown, unknown>

    await expect(
      getBalanceForeignPolkadotXcm(api, 'Moonbeam', 'addr', { symbol: 'DOT', isNative: true })
    ).rejects.toThrow(InvalidCurrencyError)
  })

  it('Moonriver - should throw error if asset has no multi-location', async () => {
    const mockApi = {} as unknown as IPolkadotApi<unknown, unknown>

    await expect(
      getBalanceForeignPolkadotXcm(mockApi, 'Moonriver', 'some-address', {
        symbol: 'DOT',
        isNative: true
      })
    ).rejects.toThrowError(InvalidCurrencyError)
  })

  it('AssetHubPolkadot -> no location - uses getBalanceAssetsPallet', async () => {
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

    const ml = {} as TLocation

    const spyAssetsPallet = vi.spyOn(api, 'getBalanceAssetsPallet')
    const spyForeignAssetsPallet = vi.spyOn(api, 'getBalanceForeignAssetsPallet')

    const res = await getBalanceForeignPolkadotXcm(api, 'AssetHubPolkadot', 'addr', {
      symbol: 'DOT',
      assetId: '4242',
      location: ml
    })

    expect(res).toBe(222n)
    expect(spyAssetsPallet).toHaveBeenCalledWith('addr', 4242)
    expect(spyForeignAssetsPallet).not.toHaveBeenCalled()
  })

  it('AssetHubPolkadot -> location without required junctions - uses getBalanceForeignAssetsPallet', async () => {
    vi.mocked(hasJunction).mockReturnValue(false)

    const ml = DOT_LOCATION

    const api = {
      getBalanceForeignAssetsPallet: vi.fn().mockResolvedValue(333n),
      getBalanceAssetsPallet: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    const spyAssetsPallet = vi.spyOn(api, 'getBalanceAssetsPallet')
    const spyForeignAssetsPallet = vi.spyOn(api, 'getBalanceForeignAssetsPallet')

    const res = await getBalanceForeignPolkadotXcm(api, 'AssetHubPolkadot', 'addr', {
      symbol: 'DOT',
      assetId: '7',
      location: ml
    })

    expect(res).toBe(333n)
    expect(spyForeignAssetsPallet).toHaveBeenCalledWith('addr', ml)
    expect(spyAssetsPallet).not.toHaveBeenCalled()
  })
})
