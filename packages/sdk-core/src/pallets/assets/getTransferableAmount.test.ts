import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  getExistentialDepositOrThrow,
  getNativeAssetSymbol
} from '@paraspell/assets'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { GeneralBuilder } from '../../builder'
import type { TSendBaseOptions, TXcmFeeDetail } from '../../types'
import { attemptDryRunFee } from './attemptDryRunFee'
import { getAssetBalanceInternal } from './balance/getAssetBalance'
import { getTransferableAmount } from './getTransferableAmount'

vi.mock('@paraspell/assets', () => ({
  findAssetInfoOrThrow: vi.fn(),
  getExistentialDepositOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./attemptDryRunFee')
vi.mock('./balance/getAssetBalance')

vi.mock('../../utils/validateAddress', () => ({
  validateAddress: vi.fn()
}))

describe('getTransferableAmount', () => {
  const mockApi = {
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined)
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockBuilder = {} as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptions>

  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('subtracts XCM fee for native asset', async () => {
    const balance = 1000n
    const ed = 100n
    const fee = 200n

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(attemptDryRunFee).mockResolvedValue({ fee } as TXcmFeeDetail)

    const result = await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      origin: 'Astar',
      destination: 'BifrostPolkadot',
      currency: { symbol: 'DOT', amount: 1000n },
      builder: mockBuilder
    })

    expect(result).toBe(balance - ed - fee)
    expect(attemptDryRunFee).toHaveBeenCalledWith({
      api: mockApi,
      builder: {},
      origin: 'Astar',
      destination: 'Astar',
      senderAddress: 'validAddress',
      currency: { symbol: 'DOT', amount: 1000n },
      disableFallback: false
    })
  })

  test('does not subtract XCM fee for non-native asset', async () => {
    const balance = 1000n
    const ed = 100n

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'USDT' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)

    const result = await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      origin: 'Astar',
      destination: 'BifrostPolkadot',
      currency: { symbol: 'USDT', amount: 1000n },
      builder: mockBuilder
    })

    expect(result).toBe(balance - ed)
    expect(attemptDryRunFee).not.toHaveBeenCalled()
  })

  test('returns 0 when transferable amount is negative', async () => {
    const balance = 250n
    const ed = 100n
    const fee = 200n

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(attemptDryRunFee).mockResolvedValue({ fee } as TXcmFeeDetail)

    const result = await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      origin: 'Astar',
      destination: 'BifrostPolkadot',
      currency: { symbol: 'DOT', amount: 1000n },
      builder: mockBuilder
    })

    expect(result).toBe(0n)
  })

  test('throws error when XCM fee is undefined for native asset', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(100n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(attemptDryRunFee).mockResolvedValue({ fee: undefined } as TXcmFeeDetail)

    await expect(
      getTransferableAmount({
        api: mockApi,
        senderAddress: 'validAddress',
        origin: 'Astar',
        destination: 'BifrostPolkadot',
        currency: { symbol: 'DOT', amount: 1000n },
        builder: mockBuilder
      })
    ).rejects.toThrow(
      'Cannot get origin xcm fee for currency {"symbol":"DOT","amount":"1000"} on node Astar.'
    )
  })

  test('sets disconnect allowed to false and disconnects after', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(1000n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(attemptDryRunFee).mockResolvedValue({ fee: 100n } as TXcmFeeDetail)

    const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await getTransferableAmount({
      api: mockApi,
      senderAddress: 'validAddress',
      origin: 'Astar',
      destination: 'BifrostPolkadot',
      currency: { symbol: 'DOT', amount: 1000n },
      builder: mockBuilder
    })

    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(1, false)
    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(2, true)
    expect(disconnectSpy).toHaveBeenCalled()
  })

  test('disconnects even if internal function throws', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(100n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(attemptDryRunFee).mockResolvedValue({ fee: undefined } as TXcmFeeDetail)

    const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await expect(
      getTransferableAmount({
        api: mockApi,
        senderAddress: 'validAddress',
        origin: 'Astar',
        destination: 'BifrostPolkadot',
        currency: { symbol: 'DOT', amount: 1000n },
        builder: mockBuilder
      })
    ).rejects.toThrow()

    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(1, false)
    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(2, true)
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
