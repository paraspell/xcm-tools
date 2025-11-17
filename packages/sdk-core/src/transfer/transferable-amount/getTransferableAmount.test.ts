// getTransferableAmount.test.ts
import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getEdFromAssetOrThrow,
  isAssetEqual
} from '@paraspell/assets'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getAssetBalanceInternal } from '../../balance'
import type { TGetTransferableAmountOptions, TXcmFeeDetail } from '../../types'
import { abstractDecimals } from '../../utils'
import { getOriginXcmFee } from '../fees'
import { getTransferableAmount } from './getTransferableAmount'

vi.mock('@paraspell/assets')
vi.mock('../../utils')
vi.mock('../../balance')
vi.mock('../fees')

describe('getTransferableAmount', () => {
  const mockApi = {
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined)
  } as unknown as IPolkadotApi<unknown, unknown>

  // eslint-disable-next-line @typescript-eslint/require-await
  const buildTx = vi.fn(async () => ({}) as unknown)

  const baseOptions = {
    api: mockApi,
    senderAddress: 'validAddress',
    origin: 'Astar',
    destination: 'BifrostPolkadot',
    currency: { symbol: 'DOT', amount: 1000n },
    buildTx
  } as TGetTransferableAmountOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    buildTx.mockClear()
  })

  test('subtracts XCM fee for native asset', async () => {
    const balance = 1000n
    const ed = 100n
    const fee = 200n

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT', decimals: 10 } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee } as TXcmFeeDetail)

    const result = await getTransferableAmount(baseOptions)

    expect(result).toBe(balance - ed - fee)
    expect(getOriginXcmFee).toHaveBeenCalledWith({
      api: mockApi,
      buildTx,
      origin: 'Astar',
      destination: 'Astar',
      senderAddress: 'validAddress',
      feeAsset: undefined,
      currency: { symbol: 'DOT', amount: 1000n },
      disableFallback: false
    })
  })

  test('does not subtract XCM fee for non-native asset', async () => {
    const balance = 1000n
    const ed = 100n

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'USDT', decimals: 6 } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)

    const result = await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      origin: 'Astar',
      destination: 'BifrostPolkadot',
      currency: { symbol: 'USDT', amount: 1000n },
      buildTx
    })

    expect(result).toBe(balance - ed)
    expect(getOriginXcmFee).not.toHaveBeenCalled()
  })

  test('returns 0 when transferable amount is negative', async () => {
    const balance = 250n
    const ed = 100n
    const fee = 200n

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT', decimals: 10 } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee } as TXcmFeeDetail)

    const result = await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      origin: 'Astar',
      destination: 'BifrostPolkadot',
      currency: { symbol: 'DOT', amount: 1000n },
      buildTx
    })

    expect(result).toBe(0n)
  })

  test('throws error when XCM fee is undefined for native asset', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT', decimals: 10 } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(100n)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: undefined } as TXcmFeeDetail)

    await expect(
      getTransferableAmount({
        api: mockApi,
        senderAddress: 'validAddress',
        origin: 'Astar',
        destination: 'BifrostPolkadot',
        currency: { symbol: 'DOT', amount: 1000n },
        buildTx
      })
    ).rejects.toThrow(
      'Cannot get origin xcm fee for currency {"symbol":"DOT","amount":"1000"} on chain Astar.'
    )
  })

  test('sets disconnect allowed to false and disconnects after', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT', decimals: 10 } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(100n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: 100n } as TXcmFeeDetail)

    const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      origin: 'Astar',
      destination: 'BifrostPolkadot',
      currency: { symbol: 'DOT', amount: 1000n },
      buildTx
    })

    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(1, false)
    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(2, true)
    expect(disconnectSpy).toHaveBeenCalled()
  })

  test('disconnects even if internal function throws', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT', decimals: 10 } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(100n)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: undefined } as TXcmFeeDetail)

    const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await expect(
      getTransferableAmount({
        api: mockApi,
        senderAddress: 'validAddress',
        origin: 'Astar',
        destination: 'BifrostPolkadot',
        currency: { symbol: 'DOT', amount: 1000n },
        buildTx
      })
    ).rejects.toThrow()

    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(1, false)
    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(2, true)
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
