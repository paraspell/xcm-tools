import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApiInstanceForNode, determineRelayChainSymbol } from '../../../utils'
import { getTransferInfo } from './getTransferInfo'
import { getBalanceNative } from '../balance/getBalanceNative'
import { getOriginFeeDetails } from '../getOriginFeeDetails'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getAssetBalance } from '../balance/getAssetBalance'
import {
  getExistentialDeposit,
  getMaxNativeTransferableAmount,
  getMinNativeTransferableAmount
} from '../getExistentialDeposit'
import type { ApiPromise } from '@polkadot/api'
import { getNativeAssetSymbol } from '../assets'
import { InvalidCurrencyError } from '../../../errors'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn(),
  determineRelayChainSymbol: vi.fn(),
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('../getExistentialDeposit', () => ({
  getExistentialDeposit: vi.fn(),
  getMinNativeTransferableAmount: vi.fn(),
  getMaxNativeTransferableAmount: vi.fn()
}))

vi.mock('../assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('../getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

vi.mock('../balance/getAssetBalance', () => ({
  getAssetBalance: vi.fn()
}))

vi.mock('../balance/getBalanceNative', () => ({
  getBalanceNative: vi.fn()
}))

vi.mock('../getOriginFeeDetails', () => ({
  getOriginFeeDetails: vi.fn()
}))

const apiMock = {
  init: vi.fn()
} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

describe('getTransferInfo', () => {
  const origin = 'Polkadot'
  const destination = 'Kusama'
  const accountOrigin = '0x123'
  const accountDestination = '0x456'
  const currency = { symbol: 'DOT' }
  const amount = '1000'

  beforeEach(() => {
    vi.mocked(createApiInstanceForNode).mockResolvedValue({} as ApiPromise)
    vi.mocked(getBalanceNative).mockResolvedValue(BigInt(5000))
    vi.mocked(getOriginFeeDetails).mockResolvedValue({
      xcmFee: BigInt(100),
      sufficientForXCM: true
    })
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'DOT', assetId: '1' })
    vi.mocked(getAssetBalance).mockResolvedValue(BigInt(2000))
    vi.mocked(getExistentialDeposit).mockReturnValue(BigInt('100'))
    vi.mocked(getMinNativeTransferableAmount).mockReturnValue(BigInt('10'))
    vi.mocked(getMaxNativeTransferableAmount).mockResolvedValue(BigInt(4000))
  })

  it('constructs the correct transfer info object', async () => {
    const transferInfo = await getTransferInfo({
      api: apiMock,
      origin,
      destination,
      accountOrigin,
      accountDestination,
      currency,
      amount
    })

    expect(transferInfo).toMatchObject({
      chain: {
        origin,
        destination,
        ecosystem: determineRelayChainSymbol(origin)
      },
      currencyBalanceOrigin: {
        balance: BigInt(2000),
        currency: 'DOT'
      },
      originFeeBalance: {
        balance: BigInt(5000),
        expectedBalanceAfterXCMFee: BigInt(4900),
        xcmFee: {
          xcmFee: BigInt(100)
        },
        existentialDeposit: BigInt(100),
        asset: getNativeAssetSymbol(origin),
        minNativeTransferableAmount: BigInt(10),
        maxNativeTransferableAmount: BigInt(4000)
      },
      destinationFeeBalance: {
        balance: BigInt(5000),
        currency: getNativeAssetSymbol(destination),
        existentialDeposit: BigInt(100)
      }
    })
  })

  it('handles errors during API interactions', async () => {
    vi.mocked(getBalanceNative).mockRejectedValue(new Error('API failure'))
    await expect(
      getTransferInfo({
        api: apiMock,
        origin,
        destination,
        accountOrigin,
        accountDestination,
        currency,
        amount
      })
    ).rejects.toThrow('API failure')
  })

  it('Throws an error if invalid currency for origin node provided', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(null)
    await expect(() =>
      getTransferInfo({
        api: apiMock,
        origin,
        destination,
        accountOrigin,
        accountDestination,
        currency,
        amount
      })
    ).rejects.toThrow(InvalidCurrencyError)
  })
})
