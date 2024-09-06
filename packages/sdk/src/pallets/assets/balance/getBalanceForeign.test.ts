import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiInstanceForNode } from '../../../utils'
import { ApiPromise } from '@polkadot/api'
import { getBalanceForeign } from './getBalanceForeign'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'

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
  let mockApi = {} as ApiPromise

  beforeEach(() => {
    vi.resetAllMocks()

    mockApi = { query: { system: { account: vi.fn() } } } as unknown as ApiPromise
    vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApi)
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'DOT', assetId: '123' })
  })

  it('should use the provided API instance if passed', async () => {
    vi.mocked(getBalanceForeignXTokens).mockResolvedValue(BigInt(1000))
    await getBalanceForeign('address', 'Acala', { symbol: 'ACA' }, mockApi)
    expect(createApiInstanceForNode).not.toHaveBeenCalled()
    expect(getAssetBySymbolOrId).toHaveBeenCalledWith('Acala', { symbol: 'ACA' })
  })

  it('should create an API instance if none is provided', async () => {
    await getBalanceForeign('address', 'Acala', { symbol: 'DOT' })
    expect(createApiInstanceForNode).toHaveBeenCalledWith('Acala')
  })

  it('returns balance for XTokens pallet', async () => {
    vi.mocked(getBalanceForeignXTokens).mockResolvedValue(BigInt(1000))
    const result = await getBalanceForeign('address', 'Acala', { symbol: 'DOT' })
    expect(getBalanceForeignXTokens).toHaveBeenCalled()
    expect(result).toBe(BigInt(1000))
  })

  it('returns balance for PolkadotXcm pallet', async () => {
    vi.mocked(getBalanceForeignPolkadotXcm).mockResolvedValue(BigInt(2000))
    const result = await getBalanceForeign('address', 'AssetHubPolkadot', { id: 1 })
    expect(getBalanceForeignPolkadotXcm).toHaveBeenCalled()
    expect(result).toBe(BigInt(2000))
  })
})
