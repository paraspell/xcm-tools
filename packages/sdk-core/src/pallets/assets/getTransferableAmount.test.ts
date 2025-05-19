import type { TAsset } from '@paraspell/assets'
import {
  findAssetForNodeOrThrow,
  getExistentialDeposit,
  getNativeAssetSymbol
} from '@paraspell/assets'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getOriginXcmFee } from '../../transfer'
import type { TXcmFeeDetail } from '../../types'
import { getAssetBalanceInternal } from './balance/getAssetBalance'
import { getTransferableAmount } from './getTransferableAmount'

vi.mock('@paraspell/assets', () => ({
  findAssetForNodeOrThrow: vi.fn(),
  getExistentialDeposit: vi.fn(),
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('../../transfer')
vi.mock('./balance/getAssetBalance')

vi.mock('../../utils/validateAddress', () => ({
  validateAddress: vi.fn()
}))

describe('getTransferableAmount', () => {
  const mockApi = {
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined)
  } as unknown as IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('throws error when existential deposit is null', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'DOT' } as TAsset)
    vi.mocked(getExistentialDeposit).mockReturnValue(null)

    await expect(
      getTransferableAmount({
        api: mockApi,
        senderAddress: 'validAddress',
        node: 'Astar',
        currency: { symbol: 'DOT' },
        tx: 'transfer'
      })
    ).rejects.toThrow('Cannot get existential deposit for currency {"symbol":"DOT"}.')
  })

  test('subtracts XCM fee for native asset', async () => {
    const balance = 1000n
    const ed = 100n
    const fee = 200n

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'DOT' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDeposit).mockReturnValue(ed.toString())
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee } as TXcmFeeDetail)

    const result = await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      node: 'Astar',
      currency: { symbol: 'DOT' },
      tx: 'transfer'
    })

    expect(result).toBe(balance - ed - fee)
    expect(getOriginXcmFee).toHaveBeenCalledWith({
      api: mockApi,
      tx: 'transfer',
      origin: 'Astar',
      destination: 'Astar',
      senderAddress: 'validAddress',
      disableFallback: false
    })
  })

  test('does not subtract XCM fee for non-native asset', async () => {
    const balance = 1000n
    const ed = 100n

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'USDT' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDeposit).mockReturnValue(ed.toString())
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)

    const result = await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      node: 'Astar',
      currency: { symbol: 'USDT' },
      tx: 'transfer'
    })

    expect(result).toBe(balance - ed)
    expect(getOriginXcmFee).not.toHaveBeenCalled()
  })

  test('returns 0 when transferable amount is negative', async () => {
    const balance = 250n
    const ed = 100n
    const fee = 200n

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'DOT' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDeposit).mockReturnValue(ed.toString())
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee } as TXcmFeeDetail)

    const result = await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      node: 'Astar',
      currency: { symbol: 'DOT' },
      tx: 'transfer'
    })

    expect(result).toBe(0n)
  })

  test('throws error when XCM fee is undefined for native asset', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'DOT' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDeposit).mockReturnValue('100')
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: undefined } as TXcmFeeDetail)

    await expect(
      getTransferableAmount({
        api: mockApi,
        senderAddress: 'validAddress',
        node: 'Astar',
        currency: { symbol: 'DOT' },
        tx: 'transfer'
      })
    ).rejects.toThrow('Cannot get origin xcm fee for currency {"symbol":"DOT"} on node Astar.')
  })

  test('sets disconnect allowed to false and disconnects after', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'DOT' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDeposit).mockReturnValue('1000')
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: 100n } as TXcmFeeDetail)

    const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      node: 'Astar',
      currency: { symbol: 'DOT' },
      tx: 'transfer'
    })

    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(1, false)
    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(2, true)
    expect(disconnectSpy).toHaveBeenCalled()
  })

  test('disconnects even if internal function throws', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'DOT' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDeposit).mockReturnValue('100')
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: undefined } as TXcmFeeDetail)

    const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await expect(
      getTransferableAmount({
        api: mockApi,
        senderAddress: 'validAddress',
        node: 'Astar',
        currency: { symbol: 'DOT' },
        tx: 'transfer'
      })
    ).rejects.toThrow()

    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(1, false)
    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(2, true)
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
