import type { TAsset, TCurrencyCore, TForeignAsset } from '@paraspell/assets'
import { findAssetForNodeOrThrow, isForeignAsset } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getEthErc20Balance } from './getEthErc20Balance'

vi.mock('@paraspell/assets', () => ({
  findAssetForNodeOrThrow: vi.fn(),
  isForeignAsset: vi.fn()
}))

vi.mock('../../../errors', () => ({
  InvalidParameterError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'InvalidParameterError'
    }
  }
}))

vi.mock('viem', () => {
  return {
    createPublicClient: vi.fn(() => mockClient),
    http: vi.fn(() => ({}))
  }
})

vi.mock('viem/chains', () => ({
  mainnet: { id: 1 }
}))

const mockReadContract = vi.fn()
const mockGetBalance = vi.fn()

const mockClient = {
  readContract: mockReadContract,
  getBalance: mockGetBalance
}

describe('getEthErc20Balance', () => {
  const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'

  beforeEach(() => {
    vi.clearAllMocks()
    mockReadContract.mockReset()
    mockGetBalance.mockReset()
  })

  it('should return ERC20 token balance for a valid foreign asset', async () => {
    const currency: TCurrencyCore = { symbol: 'USDT' }
    const mockAsset = {
      symbol: 'USDT',
      assetId: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    } as TForeignAsset

    const expectedBalance = 1234567890n
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockReadContract.mockResolvedValue(expectedBalance)

    const result = await getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)

    expect(result).toBe(expectedBalance)
    expect(mockReadContract).toHaveBeenCalledWith({
      address: mockAsset.assetId,
      abi: expect.anything(),
      functionName: 'balanceOf',
      args: [MOCK_WALLET_ADDRESS]
    })
    expect(mockGetBalance).not.toHaveBeenCalled()
  })

  it('should return ETH balance when symbol is ETH', async () => {
    const currency: TCurrencyCore = { symbol: 'ETH' }
    const mockAsset = { symbol: 'ETH', assetId: '0xETH' }
    const expectedBalance = 1000000000000000000n

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockGetBalance.mockResolvedValue(expectedBalance)

    const result = await getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)

    expect(result).toBe(expectedBalance)
    expect(mockGetBalance).toHaveBeenCalledWith({ address: MOCK_WALLET_ADDRESS })
    expect(mockReadContract).not.toHaveBeenCalled()
  })

  it('should throw if asset is not a foreign asset', async () => {
    const currency: TCurrencyCore = { symbol: 'XYZ' }
    const mockAsset = { symbol: 'XYZ', assetId: 'some-id' }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(false)

    await expect(() => getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(
      /not a foreign asset/
    )
  })

  it('should throw if foreign asset is missing assetId', async () => {
    const currency: TCurrencyCore = { symbol: 'MISSING' }
    const mockAsset = { symbol: 'MISSING', assetId: null } as unknown as TAsset

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)

    await expect(() => getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(
      /not a foreign asset/
    )
  })

  it('should propagate error from readContract', async () => {
    const currency: TCurrencyCore = { symbol: 'USDC' }
    const mockAsset = { symbol: 'USDC', assetId: '0x1234' } as TForeignAsset

    const error = new Error('revert')
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockReadContract.mockRejectedValue(error)

    await expect(() => getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow('revert')
  })

  it('should propagate error from getBalance', async () => {
    const currency: TCurrencyCore = { symbol: 'ETH' }
    const mockAsset = { symbol: 'ETH', assetId: '0xETH' }

    const error = new Error('eth getBalance failed')
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockGetBalance.mockRejectedValue(error)

    await expect(() => getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(
      'eth getBalance failed'
    )
  })
})
