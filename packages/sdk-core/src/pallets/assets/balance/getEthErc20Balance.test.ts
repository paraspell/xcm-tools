import type { TAsset, TCurrencyCore, TForeignAsset } from '@paraspell/assets'
import { findAssetForNodeOrThrow, isForeignAsset } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidParameterError } from '../../../errors'
import { getEthErc20Balance } from './getEthErc20Balance'

const mockEthersInstanceBalanceOf = vi.fn()
const mockEthersInstanceGetBalance = vi.fn()
const mockEthersProviderConstructor = vi.fn()
const mockEthersContractConstructor = vi.fn()

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

vi.mock('ethers', async () => {
  const actualEthers = await vi.importActual<typeof import('ethers')>('ethers')

  class MockJsonRpcProvider {
    getBalance = mockEthersInstanceGetBalance

    constructor(rpcUrl: string, network?: number | string) {
      mockEthersProviderConstructor(rpcUrl, network)
    }
  }

  class MockContract {
    balanceOf = mockEthersInstanceBalanceOf

    address: string
    abi: unknown
    runner: unknown

    constructor(address: string, abi: unknown, runnerOrProvider: unknown) {
      this.address = address
      this.abi = abi
      this.runner = runnerOrProvider
      mockEthersContractConstructor(address, abi, runnerOrProvider)
    }
  }

  return {
    ...actualEthers,
    ethers: {
      ...actualEthers.ethers,
      JsonRpcProvider: MockJsonRpcProvider,
      Contract: MockContract
    }
  }
})

describe('getEthErc20Balance', () => {
  const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'
  const ETH_RPC_URL = 'https://ethereum.publicnode.com/'
  const ETH_CHAIN_ID = 1
  const ERC20_ABI_EXPECTED = ['function balanceOf(address) view returns (uint256)']

  beforeEach(() => {
    vi.clearAllMocks()

    mockEthersInstanceBalanceOf.mockReset()
    mockEthersInstanceGetBalance.mockReset()
  })

  it('should return ERC20 token balance for a valid foreign asset', async () => {
    const currency: TCurrencyCore = { symbol: 'USDT' }
    const mockAsset = {
      symbol: 'USDT',
      assetId: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    } as TForeignAsset
    const mockBalanceValue = BigInt('1000000000000000000')

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset as TAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockEthersInstanceBalanceOf.mockResolvedValue(mockBalanceValue)

    const balance = await getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith('Ethereum', currency, null)
    expect(isForeignAsset).toHaveBeenCalledWith(mockAsset as TAsset)
    expect(mockEthersProviderConstructor).toHaveBeenCalledWith(ETH_RPC_URL, ETH_CHAIN_ID)
    expect(mockEthersContractConstructor).toHaveBeenCalledWith(
      mockAsset.assetId,
      ERC20_ABI_EXPECTED,
      expect.any(Object)
    )
    expect(mockEthersInstanceBalanceOf).toHaveBeenCalledWith(MOCK_WALLET_ADDRESS)
    expect(mockEthersInstanceGetBalance).not.toHaveBeenCalled()
    expect(balance).toBe(mockBalanceValue)
  })

  it('should return native ETH balance when currency is ETH', async () => {
    const currency: TCurrencyCore = { symbol: 'ETH' }
    const mockAsset: TAsset = {
      symbol: 'ETH',
      assetId: '0xETHAssetIdPlaceholder'
    }
    const mockBalanceValue = BigInt('2000000000000000000')

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockEthersInstanceGetBalance.mockResolvedValue(mockBalanceValue)

    const balance = await getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith('Ethereum', currency, null)
    expect(isForeignAsset).toHaveBeenCalledWith(mockAsset)
    expect(mockEthersProviderConstructor).toHaveBeenCalledWith(ETH_RPC_URL, ETH_CHAIN_ID)
    expect(mockEthersInstanceGetBalance).toHaveBeenCalledWith(MOCK_WALLET_ADDRESS)
    expect(mockEthersContractConstructor).not.toHaveBeenCalled()
    expect(mockEthersInstanceBalanceOf).not.toHaveBeenCalled()
    expect(balance).toBe(mockBalanceValue)
  })

  it('should throw InvalidParameterError if asset is not a foreign asset', async () => {
    const currency: TCurrencyCore = { symbol: 'XYZ' }
    const mockAsset: TAsset = {
      symbol: 'XYZ',
      assetId: 'some-id'
    }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(false)

    await expect(getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(
      InvalidParameterError
    )
    await expect(getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(
      `Asset ${JSON.stringify(mockAsset)} is not a foreign asset.`
    )
    expect(mockEthersProviderConstructor).not.toHaveBeenCalled()
  })

  it('should throw InvalidParameterError if foreign asset has no assetId', async () => {
    const currency: TCurrencyCore = { symbol: 'ABC' }
    const mockAsset = {
      symbol: 'ABC',
      assetId: null,
      type: 'ERC20'
    } as unknown as TAsset

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)

    await expect(getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(
      InvalidParameterError
    )
    await expect(getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(
      `Asset ${JSON.stringify(mockAsset)} is not a foreign asset.`
    )
    expect(mockEthersProviderConstructor).not.toHaveBeenCalled()
  })

  it('should propagate error from findAssetForNodeOrThrow', async () => {
    const currency: TCurrencyCore = { symbol: 'FAIL' }
    const errorMessage = 'Asset not found deliberately'
    vi.mocked(findAssetForNodeOrThrow).mockImplementation(() => {
      throw new Error(errorMessage)
    })

    await expect(getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(errorMessage)
    expect(isForeignAsset).not.toHaveBeenCalled()
    expect(mockEthersProviderConstructor).not.toHaveBeenCalled()
  })

  it('should propagate error from provider.getBalance when fetching ETH', async () => {
    const currency: TCurrencyCore = { symbol: 'ETH' }
    const mockAsset: TAsset = {
      symbol: 'ETH',
      assetId: '0xETHPlaceholder'
    }
    const errorMessage = 'Provider network error'

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockEthersInstanceGetBalance.mockRejectedValue(new Error(errorMessage))

    await expect(getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(errorMessage)
    expect(mockEthersProviderConstructor).toHaveBeenCalledWith(ETH_RPC_URL, ETH_CHAIN_ID)
  })

  it('should propagate error from token.balanceOf when fetching ERC20', async () => {
    const currency: TCurrencyCore = { symbol: 'USDT' }
    const mockAsset = {
      symbol: 'USDT',
      assetId: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    } as TForeignAsset
    const errorMessage = 'Token contract reverted'

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockAsset as TAsset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    mockEthersInstanceBalanceOf.mockRejectedValue(new Error(errorMessage))

    await expect(getEthErc20Balance(currency, MOCK_WALLET_ADDRESS)).rejects.toThrow(errorMessage)
    expect(mockEthersContractConstructor).toHaveBeenCalled()
  })
})
