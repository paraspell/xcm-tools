import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiInstanceForNode } from '../../../utils'
import type { ApiPromise } from '@polkadot/api'
import { getBalanceForeign } from './getBalanceForeign'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import * as palletsModule from '../../pallets'
import { InvalidCurrencyError } from '../../../errors'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn()
}))

vi.mock('../getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

vi.mock('./getBalanceForeignXTokens', () => ({
  getBalanceForeignXTokens: vi.fn()
}))

vi.mock('./getBalanceForeignPolkadotXcm', () => ({
  getBalanceForeignPolkadotXcm: vi.fn()
}))

describe('getBalanceForeign', () => {
  const mockApi = {
    init: vi.fn(),
    getBalanceForeignXTokens: vi.fn(),
    getBalanceForeign: vi.fn()
  } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

  beforeEach(() => {
    vi.resetAllMocks()

    vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApi)
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'DOT', assetId: '123' })
  })

  it('should use the provided API instance if passed', async () => {
    vi.spyOn(mockApi, 'getBalanceForeignXTokens').mockResolvedValue(BigInt(1000))
    await getBalanceForeign({
      address: 'address',
      node: 'Acala',
      currency: { symbol: 'ACA' },
      api: mockApi
    })
    expect(createApiInstanceForNode).not.toHaveBeenCalled()
    expect(getAssetBySymbolOrId).toHaveBeenCalledWith('Acala', { symbol: 'ACA' })
  })

  it('should create an API instance if none is provided', async () => {
    const spy = vi.spyOn(mockApi, 'init')
    await getBalanceForeign({
      address: 'address',
      node: 'Acala',
      currency: { symbol: 'DOT' },
      api: mockApi
    })
    expect(spy).toHaveBeenCalledWith('Acala')
  })

  it('returns balance for XTokens pallet', async () => {
    vi.mocked(getBalanceForeignXTokens).mockResolvedValue(BigInt(1000))
    const result = await getBalanceForeign({
      address: 'address',
      node: 'Acala',
      currency: { symbol: 'DOT' },
      api: mockApi
    })
    expect(getBalanceForeignXTokens).toHaveBeenCalled()
    expect(result).toBe(BigInt(1000))
  })

  it('returns balance for PolkadotXcm pallet', async () => {
    vi.mocked(getBalanceForeignPolkadotXcm).mockResolvedValue(BigInt(2000))
    const result = await getBalanceForeign({
      address: 'address',
      node: 'Subsocial',
      currency: { symbol: 'DOT' },
      api: mockApi
    })
    expect(getBalanceForeignPolkadotXcm).toHaveBeenCalled()
    expect(result).toBe(BigInt(2000))
  })

  it('throws an error for unsupported pallet', async () => {
    vi.spyOn(palletsModule, 'getDefaultPallet').mockReturnValue('RelayerXcm')
    await expect(
      getBalanceForeign({
        address: 'address',
        node: 'Acala',
        currency: { symbol: 'DOT' },
        api: mockApi
      })
    ).rejects.toThrow('Unsupported pallet')
  })

  it('throws an error for invalid currency', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(null)
    await expect(
      getBalanceForeign({
        address: 'address',
        node: 'Acala',
        currency: { symbol: 'DOT' },
        api: mockApi
      })
    ).rejects.toThrow(InvalidCurrencyError)
  })
})
