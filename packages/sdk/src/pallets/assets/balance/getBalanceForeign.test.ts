import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiInstanceForNode } from '../../../utils'
import type { ApiPromise } from '@polkadot/api'
import { getBalanceForeign } from './getBalanceForeign'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'

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
    getBalanceForeignXTokens: vi.fn()
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
    await getBalanceForeign({
      address: 'address',
      node: 'Acala',
      currency: { symbol: 'DOT' },
      api: mockApi
    })
    expect(createApiInstanceForNode).toHaveBeenCalledWith('Acala')
  })

  it('returns balance for XTokens pallet', async () => {
    const spy = vi.spyOn(mockApi, 'getBalanceForeignXTokens').mockResolvedValue(BigInt(1000))
    const result = await getBalanceForeign({
      address: 'address',
      node: 'Acala',
      currency: { symbol: 'DOT' },
      api: mockApi
    })
    expect(spy).toHaveBeenCalled()
    expect(result).toBe(BigInt(1000))
  })

  it('returns balance for PolkadotXcm pallet', async () => {
    vi.mocked(getBalanceForeignPolkadotXcm).mockResolvedValue(BigInt(2000))
    const result = await getBalanceForeign({
      address: 'address',
      node: 'Acala',
      currency: { symbol: 'XCM' },
      api: mockApi
    })
    expect(getBalanceForeignPolkadotXcm).toHaveBeenCalled()
    expect(result).toBe(BigInt(2000))
  })
})
