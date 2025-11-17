import type { TAssetInfo } from '@paraspell/assets'
import { findAssetOnDestOrThrow, getEdFromAssetOrThrow, normalizeSymbol } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'
import { type TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getAssetBalanceInternal } from '../../balance'
import { DryRunFailedError, UnableToComputeError } from '../../errors'
import type { TGetXcmFeeResult, TVerifyEdOnDestinationOptions } from '../../types'
import { abstractDecimals, validateAddress } from '../../utils'
import { getXcmFeeInternal } from '../fees'
import { verifyEdOnDestinationInternal } from './verifyEdOnDestinationInternal'

vi.mock('@paraspell/assets')

vi.mock('../../utils')
vi.mock('../../balance')
vi.mock('../fees')

describe('verifyEdOnDestinationInternal', () => {
  const mockApi = {
    getMethod: vi.fn(),
    clone: () => ({
      init: vi.fn()
    })
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockOrigin = 'OriginChain' as TSubstrateChain
  const mockDestination = 'DestinationChain' as TChain
  const mockAddress = 'destinationAddress'
  const mockSenderAddress = 'senderAddress'
  const mockCurrency = { symbol: 'DOT', amount: 1000000000000n }

  const realTx = { kind: 'real' }

  const buildTx = vi.fn(async () => Promise.resolve(realTx as unknown))

  const defaultOptions = {
    api: mockApi,
    buildTx,
    origin: mockOrigin,
    destination: mockDestination,
    address: mockAddress,
    senderAddress: mockSenderAddress,
    currency: mockCurrency
  } as TVerifyEdOnDestinationOptions<unknown, unknown>

  const asset = {
    symbol: 'DOT',
    decimals: 10
  } as TAssetInfo

  beforeEach(() => {
    vi.resetAllMocks()
    buildTx.mockClear()
    vi.mocked(validateAddress).mockImplementation(() => {})
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(asset)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(10000000000n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(50000000000n)
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT', dryRunError: undefined }
    } as TGetXcmFeeResult<boolean>)
    vi.mocked(normalizeSymbol).mockImplementation(symbol =>
      symbol ? String(symbol).toUpperCase() : ''
    )
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    vi.spyOn(mockApi, 'getMethod').mockReturnValue('transferAssets')
  })

  it('calls getXcmFee with buildTx and checks method on a real built tx', async () => {
    const getMethodSpy = vi.spyOn(mockApi, 'getMethod')

    await verifyEdOnDestinationInternal(defaultOptions)

    expect(getXcmFeeInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        api: mockApi,
        buildTx,
        origin: mockOrigin,
        destination: mockDestination,
        senderAddress: mockSenderAddress,
        address: mockAddress,
        currency: expect.objectContaining({ amount: expect.any(BigInt) }),
        disableFallback: false
      })
    )

    expect(buildTx).toHaveBeenCalled()
    expect(getMethodSpy).toHaveBeenCalledWith(realTx)
  })

  it('throws DryRunFailedError if assetHub dryRunError occurs', async () => {
    const hopError = 'AssetHub dry run failed'
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT', dryRunError: undefined },
      assetHub: { fee: 500000000n, dryRunError: hopError }
    } as TGetXcmFeeResult<boolean>)

    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(
      new DryRunFailedError(hopError, 'assetHub')
    )
  })

  it('throws DryRunFailedError if bridgeHub dryRunError occurs and assetHub has none', async () => {
    const hopError = 'BridgeHub dry run failed'
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT', dryRunError: undefined },
      assetHub: { fee: 500000000n, dryRunError: undefined },
      bridgeHub: { fee: 200000000n, dryRunError: hopError }
    } as TGetXcmFeeResult<boolean>)

    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(
      new DryRunFailedError(hopError, 'bridgeHub')
    )
  })

  it('prioritizes assetHub dryRunError over bridgeHub', async () => {
    const assetHubError = 'AssetHub specific dry run failed'
    const bridgeHubError = 'BridgeHub also failed but should be ignored'
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT', dryRunError: undefined },
      assetHub: { fee: 500000000n, dryRunError: assetHubError },
      bridgeHub: { fee: 200000000n, dryRunError: bridgeHubError }
    } as TGetXcmFeeResult<boolean>)

    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(
      new DryRunFailedError(assetHubError, 'assetHub')
    )
  })

  it('returns true when balance < ED and amount - destFee > ED', async () => {
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(5000000000n)

    const spy = vi.spyOn(mockApi, 'getMethod')

    const result = await verifyEdOnDestinationInternal(defaultOptions)

    expect(result).toBe(true)
    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith(mockOrigin, mockDestination, mockCurrency)
    expect(getEdFromAssetOrThrow).toHaveBeenCalledWith(asset)
    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      address: mockAddress,
      chain: mockDestination,
      api: expect.any(Object),
      asset
    })
    expect(getXcmFeeInternal).toHaveBeenCalledWith(
      expect.objectContaining({ buildTx, origin: mockOrigin, destination: mockDestination })
    )
    expect(spy).toHaveBeenCalledWith(realTx)
  })

  it('returns true when balance >= ED and amount - destFee > 0', async () => {
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(15000000000n)
    const result = await verifyEdOnDestinationInternal(defaultOptions)
    expect(result).toBe(true)
  })

  it('returns false when balance < ED and amount - destFee <= ED', async () => {
    const opts = {
      ...defaultOptions,
      currency: { ...defaultOptions.currency, amount: 10000000000n }
    }
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(5000000000n)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(10000000000n)
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 95000000000n, currency: 'DOT', dryRunError: undefined }
    } as TGetXcmFeeResult<boolean>)

    const result = await verifyEdOnDestinationInternal(opts)
    expect(result).toBe(false)
  })

  it('returns false when balance >= ED and amount - destFee <= 0', async () => {
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(15000000000n)
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000000n, currency: 'DOT', dryRunError: undefined }
    } as TGetXcmFeeResult<boolean>)

    const result = await verifyEdOnDestinationInternal(defaultOptions)
    expect(result).toBe(false)
  })

  it('throws if asset symbol and fee currency mismatch (normalizeSymbol)', async () => {
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ symbol: 'KSM', decimals: 12 } as TAssetInfo)
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { dryRunError: undefined },
      destination: { fee: 1000000000n, currency: 'DOT', dryRunError: undefined }
    } as TGetXcmFeeResult<boolean>)
    vi.mocked(normalizeSymbol).mockImplementation((s: string) => s)

    const msg = `The XCM fee could not be calculated because the origin or destination chain does not support DryRun.
       As a result, fee estimation is only available through PaymentInfo, which provides the cost in the native asset.
       This limitation restricts support to transfers involving the native asset of the Destination chain only.`

    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrowError(
      new UnableToComputeError(msg)
    )
  })

  it('re-throws from validateAddress', async () => {
    const e = new Error('Invalid address')
    vi.mocked(validateAddress).mockImplementation(() => {
      throw e
    })
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(e)
  })

  it('re-throws from findAssetOnDestOrThrow', async () => {
    const e = new Error('Asset not found')
    vi.mocked(findAssetOnDestOrThrow).mockImplementation(() => {
      throw e
    })
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(e)
  })

  it('re-throws from getXcmFee', async () => {
    const e = new Error('XCM fee retrieval failed')
    vi.mocked(getXcmFeeInternal).mockRejectedValue(e)
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(e)
  })

  it('re-throws from getAssetBalanceInternal', async () => {
    const e = new Error('Balance retrieval failed')
    vi.mocked(getAssetBalanceInternal).mockRejectedValue(e)
    await expect(verifyEdOnDestinationInternal(defaultOptions)).rejects.toThrow(e)
  })
})
