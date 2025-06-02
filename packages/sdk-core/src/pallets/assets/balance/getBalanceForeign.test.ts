import { findAssetForNodeOrThrow } from '@paraspell/assets'
import * as palletsModule from '@paraspell/pallets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { createApiInstanceForNode } from '../../../utils'
import { getBalanceForeign } from './getBalanceForeign'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'
import { getEthErc20Balance } from './getEthErc20Balance'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  findAssetForNodeOrThrow: vi.fn()
}))

vi.mock('./getBalanceForeignXTokens', () => ({
  getBalanceForeignXTokens: vi.fn()
}))

vi.mock('./getBalanceForeignPolkadotXcm', () => ({
  getBalanceForeignPolkadotXcm: vi.fn()
}))

vi.mock('./getEthErc20Balance', () => ({
  getEthErc20Balance: vi.fn()
}))

describe('getBalanceForeign', () => {
  const mockApi = {
    init: vi.fn(),
    getBalanceForeignXTokens: vi.fn(),
    getBalanceForeign: vi.fn(),
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApi)
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'DOT', assetId: '123' })
  })

  it('should return Ethereum ERC20 balance if node is Ethereum', async () => {
    const mockBalance = 500n
    const mockCurrency = { symbol: 'ETH' }
    const mockAddress = '0x123'
    vi.mocked(getEthErc20Balance).mockResolvedValue(mockBalance)
    const result = await getBalanceForeign({
      address: mockAddress,
      node: 'Ethereum',
      currency: mockCurrency,
      api: mockApi
    })
    expect(result).toBe(mockBalance)
    expect(getEthErc20Balance).toHaveBeenCalledWith(mockCurrency, mockAddress)
  })

  it('should use the provided API instance if passed', async () => {
    vi.spyOn(mockApi, 'getBalanceForeignXTokens').mockResolvedValue(1000n)
    await getBalanceForeign({
      address: 'address',
      node: 'Acala',
      currency: { symbol: 'ACA' },
      api: mockApi
    })
    expect(createApiInstanceForNode).not.toHaveBeenCalled()
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith('Acala', { symbol: 'ACA' }, null)
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
    vi.mocked(getBalanceForeignXTokens).mockResolvedValue(1000n)
    const result = await getBalanceForeign({
      address: 'address',
      node: 'Acala',
      currency: { symbol: 'DOT' },
      api: mockApi
    })
    expect(getBalanceForeignXTokens).toHaveBeenCalled()
    expect(result).toBe(1000n)
  })

  it('returns balance for PolkadotXcm pallet', async () => {
    vi.mocked(getBalanceForeignPolkadotXcm).mockResolvedValue(2000n)
    const result = await getBalanceForeign({
      address: 'address',
      node: 'Subsocial',
      currency: { symbol: 'DOT' },
      api: mockApi
    })
    expect(getBalanceForeignPolkadotXcm).toHaveBeenCalled()
    expect(result).toBe(2000n)
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
})
