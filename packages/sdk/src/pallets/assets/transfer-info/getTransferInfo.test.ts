import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApiInstanceForNode } from '../../../utils'
import { getTransferInfo } from './getTransferInfo'
import { getBalanceNativeInternal } from '../balance/getBalanceNative'
import { getOriginFeeDetailsInternal } from '../getOriginFeeDetails'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getAssetBalanceInternal } from '../balance/getAssetBalance'
import { getMaxNativeTransferableAmount } from '../getTransferableAmount'
import { InvalidCurrencyError } from '../../../errors'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic, TPjsApi } from '../../../pjs/types'
import { getNativeAssetSymbol, getRelayChainSymbol, getExistentialDeposit } from '../assets'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn(),
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('../getTransferableAmount', () => ({
  getMaxNativeTransferableAmount: vi.fn()
}))

vi.mock('../assets', () => ({
  getNativeAssetSymbol: vi.fn(),
  getExistentialDeposit: vi.fn(),
  getRelayChainSymbol: vi.fn()
}))

vi.mock('../getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

vi.mock('../balance/getAssetBalance', () => ({
  getAssetBalanceInternal: vi.fn()
}))

vi.mock('../balance/getBalanceNative', () => ({
  getBalanceNativeInternal: vi.fn()
}))

vi.mock('../getOriginFeeDetails', () => ({
  getOriginFeeDetailsInternal: vi.fn()
}))

const apiMock = {
  init: vi.fn(),
  disconnect: vi.fn(),
  setDisconnectAllowed: vi.fn(),
  clone: vi.fn().mockReturnValue({
    init: vi.fn(),
    disconnect: vi.fn(),
    setDisconnectAllowed: vi.fn()
  })
} as unknown as IPolkadotApi<TPjsApi, Extrinsic>

describe('getTransferInfo', () => {
  const origin = 'Polkadot'
  const destination = 'Kusama'
  const accountOrigin = '0x123'
  const accountDestination = '0x456'
  const currency = { symbol: 'DOT', amount: '1000' }

  beforeEach(() => {
    vi.mocked(createApiInstanceForNode).mockResolvedValue({} as TPjsApi)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(BigInt(5000))
    vi.mocked(getOriginFeeDetailsInternal).mockResolvedValue({
      xcmFee: BigInt(100),
      sufficientForXCM: true
    })
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'DOT', assetId: '1' })
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(BigInt(2000))
    vi.mocked(getExistentialDeposit).mockReturnValue('100')
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
      amount: '100'
    })

    expect(transferInfo).toMatchObject({
      chain: {
        origin,
        destination,
        ecosystem: getRelayChainSymbol(origin)
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
        minNativeTransferableAmount: BigInt(100),
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
    vi.mocked(getBalanceNativeInternal).mockRejectedValue(new Error('API failure'))
    await expect(
      getTransferInfo({
        api: apiMock,
        origin,
        destination,
        accountOrigin,
        accountDestination,
        currency,
        amount: '100'
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
        amount: '100'
      })
    ).rejects.toThrow(InvalidCurrencyError)
  })
})
