import { findAssetInfoOrThrow } from '@paraspell/assets'
import * as palletsModule from '@paraspell/pallets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { createChainClient } from '../../../utils'
import { getBalanceForeign } from './getBalanceForeign'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'
import { getEthErc20Balance } from './getEthErc20Balance'

vi.mock('../../../utils', () => ({
  createChainClient: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  findAssetInfoOrThrow: vi.fn()
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
    vi.mocked(createChainClient).mockResolvedValue(mockApi)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT', assetId: '123', decimals: 10 })
  })

  it('should return Ethereum ERC20 balance if chain is Ethereum', async () => {
    const mockBalance = 500n
    const mockCurrency = { symbol: 'ETH' }
    const mockAddress = '0x123'
    vi.mocked(getEthErc20Balance).mockResolvedValue(mockBalance)
    const result = await getBalanceForeign({
      address: mockAddress,
      chain: 'Ethereum',
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
      chain: 'Acala',
      currency: { symbol: 'ACA' },
      api: mockApi
    })
    expect(createChainClient).not.toHaveBeenCalled()
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Acala', { symbol: 'ACA' }, null)
  })

  it('should create an API instance if none is provided', async () => {
    const spy = vi.spyOn(mockApi, 'init')
    await getBalanceForeign({
      address: 'address',
      chain: 'Acala',
      currency: { symbol: 'DOT' },
      api: mockApi
    })
    expect(spy).toHaveBeenCalledWith('Acala')
  })

  it('returns balance for XTokens pallet', async () => {
    vi.mocked(getBalanceForeignXTokens).mockResolvedValue(1000n)
    const result = await getBalanceForeign({
      address: 'address',
      chain: 'Acala',
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
      chain: 'AssetHubPolkadot',
      currency: { symbol: 'DOT' },
      api: mockApi
    })
    expect(getBalanceForeignPolkadotXcm).toHaveBeenCalled()
    expect(result).toBe(2000n)
  })

  it('throws an error for unsupported pallet', async () => {
    vi.spyOn(palletsModule, 'getDefaultPallet').mockReturnValue('Utility')
    await expect(
      getBalanceForeign({
        address: 'address',
        chain: 'Acala',
        currency: { symbol: 'DOT' },
        api: mockApi
      })
    ).rejects.toThrow('Unsupported pallet')
  })
})
