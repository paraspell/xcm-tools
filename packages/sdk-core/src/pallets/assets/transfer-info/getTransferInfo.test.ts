import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { InvalidCurrencyError } from '../../../errors'
import { createApiInstanceForNode } from '../../../utils'
import { getExistentialDeposit, getNativeAssetSymbol, getRelayChainSymbol } from '../assets'
import { getAssetBalanceInternal } from '../balance/getAssetBalance'
import { getBalanceNativeInternal } from '../balance/getBalanceNative'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getOriginFeeDetailsInternal } from '../getOriginFeeDetails'
import { getMaxNativeTransferableAmount } from '../getTransferableAmount'
import { getTransferInfo } from './getTransferInfo'

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
} as unknown as IPolkadotApi<unknown, unknown>

describe('getTransferInfo', () => {
  const origin = 'Polkadot'
  const destination = 'Kusama'
  const accountOrigin = '0x123'
  const accountDestination = '0x456'
  const currency = { symbol: 'DOT', amount: '1000' }

  beforeEach(() => {
    vi.mocked(createApiInstanceForNode).mockResolvedValue({})
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(5000n)
    vi.mocked(getOriginFeeDetailsInternal).mockResolvedValue({
      xcmFee: 100n,
      sufficientForXCM: true
    })
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'DOT', assetId: '1' })
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(2000n)
    vi.mocked(getExistentialDeposit).mockReturnValue('100')
    vi.mocked(getMaxNativeTransferableAmount).mockResolvedValue(4000n)
  })

  it('constructs the correct transfer info object', async () => {
    const transferInfo = await getTransferInfo({
      api: apiMock,
      origin,
      destination,
      accountOrigin,
      accountDestination,
      currency
    })

    expect(transferInfo).toMatchObject({
      chain: {
        origin,
        destination,
        ecosystem: getRelayChainSymbol(origin)
      },
      currencyBalanceOrigin: {
        balance: 2000n,
        currency: 'DOT'
      },
      originFeeBalance: {
        balance: 5000n,
        expectedBalanceAfterXCMFee: 4900n,
        xcmFee: {
          xcmFee: 100n
        },
        existentialDeposit: 100n,
        asset: getNativeAssetSymbol(origin),
        minNativeTransferableAmount: 100n,
        maxNativeTransferableAmount: 4000n
      },
      destinationFeeBalance: {
        balance: 5000n,
        currency: getNativeAssetSymbol(destination),
        existentialDeposit: 100n
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
        currency
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
        currency
      })
    ).rejects.toThrow(InvalidCurrencyError)
  })
})
