import type { TAssetInfo, TForeignAssetInfo } from '@paraspell/assets'
import { getNativeAssetSymbol, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getEthErc20Balance } from './getEthErc20Balance'

vi.mock('@paraspell/assets', () => ({
  isForeignAsset: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('viem', () => ({
  formatUnits: vi.fn(),
  parseUnits: vi.fn(),
  createPublicClient: vi.fn(() => mockClient),
  http: vi.fn(() => ({}))
}))

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
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ETH')
  })

  it('should return ERC20 token balance for a valid foreign asset', async () => {
    const asset = {
      symbol: 'USDT',
      assetId: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    } as TForeignAssetInfo

    const expectedBalance = 1234567890n
    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockReadContract.mockResolvedValue(expectedBalance)

    const result = await getEthErc20Balance(asset, MOCK_WALLET_ADDRESS)

    expect(result).toBe(expectedBalance)
    expect(mockReadContract).toHaveBeenCalledWith({
      address: asset.assetId,
      abi: expect.anything(),
      functionName: 'balanceOf',
      args: [MOCK_WALLET_ADDRESS]
    })
    expect(mockGetBalance).not.toHaveBeenCalled()
  })

  it('should return ETH balance when symbol is ETH', async () => {
    const asset = {
      symbol: 'ETH',
      assetId: '0x0000000000000000000000000000000000000000'
    } as TAssetInfo
    const expectedBalance = 1000000000000000000n

    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockGetBalance.mockResolvedValue(expectedBalance)

    const result = await getEthErc20Balance(asset, MOCK_WALLET_ADDRESS)

    expect(result).toBe(expectedBalance)
    expect(mockGetBalance).toHaveBeenCalledWith({ address: MOCK_WALLET_ADDRESS })
    expect(mockReadContract).not.toHaveBeenCalled()
  })

  it('should throw if asset is not a foreign asset', async () => {
    const asset = { symbol: 'XYZ' } as TAssetInfo

    vi.mocked(isForeignAsset).mockReturnValue(false)

    await expect(() => getEthErc20Balance(asset, MOCK_WALLET_ADDRESS)).rejects.toThrow(
      /not a foreign asset/
    )
  })

  it('should throw if foreign asset is missing assetId', async () => {
    const asset = { symbol: 'MISSING' } as TAssetInfo

    vi.mocked(isForeignAsset).mockReturnValue(true)

    await expect(() => getEthErc20Balance(asset, MOCK_WALLET_ADDRESS)).rejects.toThrow(
      InvalidCurrencyError
    )
  })
})
