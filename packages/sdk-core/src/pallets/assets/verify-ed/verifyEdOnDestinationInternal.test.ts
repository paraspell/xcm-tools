import type { TAsset } from '@paraspell/assets'
import {
  findAssetOnDestOrThrow,
  getExistentialDepositOrThrow,
  normalizeSymbol
} from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { DryRunFailedError, UnableToComputeError } from '../../../errors'
import { getXcmFee } from '../../../transfer'
import type { TGetXcmFeeResult, TVerifyEdOnDestinationOptions } from '../../../types'
import { validateAddress } from '../../../utils'
import { getAssetBalanceInternal } from '../balance/getAssetBalance'
import { verifyEdOnDestinationInternal } from './verifyEdOnDestinationInternal' // Adjust path as needed

vi.mock('@paraspell/assets', () => ({
  findAssetOnDestOrThrow: vi.fn(),
  getExistentialDepositOrThrow: vi.fn(),
  normalizeSymbol: vi.fn()
}))

vi.mock('../../../transfer', () => ({
  getXcmFee: vi.fn()
}))

vi.mock('../../../utils', () => ({
  validateAddress: vi.fn()
}))

vi.mock('../balance/getAssetBalance', () => ({
  getAssetBalanceInternal: vi.fn()
}))

describe('verifyEdOnDestinationInternal', () => {
  const mockApi = {
    getMethod: vi.fn(),
    clone: () => ({
      init: vi.fn()
    })
  } as unknown as IPolkadotApi<unknown, unknown>
  const mockTx = {} as unknown
  const mockOrigin = 'OriginNode' as TNodeDotKsmWithRelayChains
  const mockDestination = 'DestinationNode' as TNodeDotKsmWithRelayChains
  const mockAddress = 'destinationAddress'
  const mockSenderAddress = 'senderAddress'
  const mockCurrency = { symbol: 'DOT', amount: '1000000000000' }

  const defaultOptions = {
    api: mockApi,
    tx: mockTx,
    origin: mockOrigin,
    destination: mockDestination,
    address: mockAddress,
    senderAddress: mockSenderAddress,
    currency: mockCurrency
  } as TVerifyEdOnDestinationOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(validateAddress).mockImplementation(() => {})
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ symbol: 'DOT', decimals: 10 } as TAsset)
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(10000000000n) // 1 DOT
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(50000000000n) // 5 DOT
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT' } // 0.1 DOT
    } as TGetXcmFeeResult)
    vi.mocked(normalizeSymbol).mockImplementation(symbol => {
      if (!symbol) return ''
      return symbol.toUpperCase()
    })
  })

  it('should throw DryRunFailedError if assetHub dryRunError occurs', async () => {
    const hopError = 'AssetHub dry run failed'
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT', dryRunError: undefined },
      assetHub: { fee: 500000000n, dryRunError: hopError }
    } as TGetXcmFeeResult)

    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(
      new DryRunFailedError(hopError, 'assetHub')
    )
  })

  it('should throw DryRunFailedError if bridgeHub dryRunError occurs and assetHub error is undefined', async () => {
    const hopError = 'BridgeHub dry run failed'
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT', dryRunError: undefined },
      assetHub: { fee: 500000000n, dryRunError: undefined },
      bridgeHub: { fee: 200000000n, dryRunError: hopError }
    } as TGetXcmFeeResult)

    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(
      new DryRunFailedError(hopError, 'bridgeHub')
    )
  })

  it('should prioritize assetHub dryRunError if both assetHub and bridgeHub errors exist', async () => {
    const assetHubError = 'AssetHub specific dry run failed'
    const bridgeHubError = 'BridgeHub also failed but should be ignored'
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT', dryRunError: undefined },
      assetHub: { fee: 500000000n, dryRunError: assetHubError },
      bridgeHub: { fee: 200000000n, dryRunError: bridgeHubError }
    } as TGetXcmFeeResult)

    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(
      new DryRunFailedError(assetHubError, 'assetHub')
    )
  })

  it('should return true if amount after fee is greater than ED when balance is less than ED', async () => {
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(5000000000n) // 0.5 DOT
    // amount (10 DOT) - destFee (0.1 DOT) = 9.9 DOT
    // balance (0.5 DOT) < ed (1 DOT) ? ed (1 DOT) : 0 -> 1 DOT
    // 9.9 DOT > 1 DOT -> true
    const result = await verifyEdOnDestinationInternal(defaultOptions)
    expect(result).toBe(true)
    expect(validateAddress).toHaveBeenCalledWith(mockAddress, mockDestination)
    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith(mockOrigin, mockDestination, mockCurrency)
    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(mockDestination, {
      symbol: mockCurrency.symbol
    })
    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      address: mockAddress,
      node: mockDestination,
      api: expect.any(Object),
      currency: {
        symbol: mockCurrency.symbol
      }
    })
    expect(getXcmFee).toHaveBeenCalledWith({
      api: mockApi,
      tx: mockTx,
      origin: mockOrigin,
      destination: mockDestination,
      senderAddress: mockSenderAddress,
      address: mockAddress,
      currency: mockCurrency,
      disableFallback: false
    })
  })

  it('should return true if amount after fee is greater than 0 when balance is greater than or equal to ED', async () => {
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(15000000000n) // 1.5 DOT
    // amount (10 DOT) - destFee (0.1 DOT) = 9.9 DOT
    // balance (1.5 DOT) < ed (1 DOT) ? ed (1 DOT) : 0 -> 0
    // 9.9 DOT > 0 -> true
    const result = await verifyEdOnDestinationInternal(defaultOptions)
    expect(result).toBe(true)
  })

  it('should return false if amount after fee is not greater than ED when balance is less than ED', async () => {
    const testSpecificOptions = {
      ...defaultOptions,
      currency: { ...defaultOptions.currency, amount: '100000000000' } // 10 DOT
    }

    vi.mocked(getAssetBalanceInternal).mockResolvedValue(5000000000n) // 0.5 DOT
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(10000000000n) // 1 DOT
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 95000000000n, currency: 'DOT' } // 9.5 DOT
    } as TGetXcmFeeResult)

    // amount (10 DOT) - destFee (9.5 DOT) = 5000000000n (0.5 DOT)
    // balance (0.5 DOT) < ed (1 DOT) ? ed (10000000000n) : 0
    // 0.5 DOT > 10000000000n (1 DOT) ? false

    const result = await verifyEdOnDestinationInternal(testSpecificOptions)
    expect(result).toBe(false)
  })

  it('should return false if amount after fee is not greater than 0 when balance is greater than or equal to ED and fee is high', async () => {
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(15000000000n) // 1.5 DOT
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000000n, currency: 'DOT' } // 10 DOT
    } as TGetXcmFeeResult)
    // amount (10 DOT) - destFee (10 DOT) = 0 DOT
    // balance (1.5 DOT) < ed (1 DOT) ? ed (1 DOT) : 0 -> 0
    // 0 DOT > 0 -> false
    const result = await verifyEdOnDestinationInternal(defaultOptions)
    expect(result).toBe(false)
  })

  it('should throw error if destination xcm fee is undefined', async () => {
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: undefined, currency: 'DOT' }
    } as TGetXcmFeeResult)
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrowError(
      `Cannot get destination xcm fee for currency ${JSON.stringify(mockCurrency)} on node ${mockDestination}.`
    )
  })

  it('should throw InvalidParameterError if asset symbol does not match fee currency symbol', async () => {
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ symbol: 'KSM', decimals: 12 } as TAsset)
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT' }
    } as TGetXcmFeeResult)
    vi.mocked(normalizeSymbol).mockImplementation(symbol => symbol as string)

    const expectedErrorMessage = `The XCM fee could not be calculated because the origin or destination chain does not support DryRun.
       As a result, fee estimation is only available through PaymentInfo, which provides the cost in the native asset.
       This limitation restricts support to transfers involving the native asset of the Destination chain only.`
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrowError(
      new UnableToComputeError(expectedErrorMessage)
    )
  })

  it('should re-throw error from validateAddress', async () => {
    const validationError = new Error('Invalid address')
    vi.mocked(validateAddress).mockImplementation(() => {
      throw validationError
    })
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(validationError)
  })

  it('should re-throw error from findAssetForNodeOrThrow', async () => {
    const findAssetError = new Error('Asset not found')
    vi.mocked(findAssetOnDestOrThrow).mockImplementation(() => {
      throw findAssetError
    })
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(findAssetError)
  })

  it('should re-throw error from getXcmFee', async () => {
    const xcmFeeError = new Error('XCM fee retrieval failed')
    vi.mocked(getXcmFee).mockRejectedValue(xcmFeeError)
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(xcmFeeError)
  })

  it('should re-throw error from getAssetBalanceInternal', async () => {
    const balanceError = new Error('Balance retrieval failed')
    vi.mocked(getAssetBalanceInternal).mockRejectedValue(balanceError)
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(balanceError)
  })
})
