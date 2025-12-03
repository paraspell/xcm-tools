import type { TCurrencyCore, TNativeAssetInfo, WithAmount } from '@paraspell/assets'
import { findAssetInfoOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TGetOriginXcmFeeEstimateOptions, TGetXcmFeeEstimateDetail } from '../../types'
import { abstractDecimals } from '../../utils'
import { padFee } from '../../utils/fees'
import { getOriginXcmFeeEstimate } from './getOriginXcmFeeEstimate'
import { isSufficientOrigin } from './isSufficient'

vi.mock('@paraspell/assets')
vi.mock('../../utils/fees')
vi.mock('../../utils')
vi.mock('./isSufficient')

describe('getOriginXcmFeeEstimate', () => {
  const mockApi = {
    calculateTransactionFee: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>
  const mockTx = {} as unknown
  const mockSenderAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
  const mockOriginChain = 'origin' as TSubstrateChain
  const mockDestinationChain = 'destination' as TChain
  const currency = { symbol: 'DOT', amount: 100000n } as WithAmount<TCurrencyCore>
  const mockAsset: TNativeAssetInfo = { symbol: 'DOT', decimals: 10, isNative: true }

  const MOCK_RAW_FEE = 100000000000n
  const MOCK_PADDED_FEE = 120000000000n
  const MOCK_NATIVE_ASSET_SYMBOL = 'DOT'

  beforeEach(() => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(mockAsset)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
  })

  it('should correctly calculate and return the origin XCM fee estimate including sufficiency', async () => {
    vi.mocked(padFee).mockReturnValue(MOCK_PADDED_FEE)
    vi.mocked(getNativeAssetSymbol).mockReturnValue(MOCK_NATIVE_ASSET_SYMBOL)
    vi.mocked(isSufficientOrigin).mockResolvedValue(true)
    const spy = vi.spyOn(mockApi, 'calculateTransactionFee').mockResolvedValue(MOCK_RAW_FEE)

    const options: TGetOriginXcmFeeEstimateOptions<unknown, unknown> = {
      api: mockApi,
      tx: mockTx,
      origin: mockOriginChain,
      currency,
      destination: mockDestinationChain,
      senderAddress: mockSenderAddress
    }

    const result: TGetXcmFeeEstimateDetail = await getOriginXcmFeeEstimate(options)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(mockTx, mockSenderAddress)

    expect(padFee).toHaveBeenCalledTimes(1)
    expect(padFee).toHaveBeenCalledWith(
      MOCK_RAW_FEE,
      mockOriginChain,
      mockDestinationChain,
      'origin'
    )

    expect(isSufficientOrigin).toHaveBeenCalledTimes(1)
    expect(isSufficientOrigin).toHaveBeenCalledWith(
      mockApi,
      mockOriginChain,
      mockDestinationChain,
      mockSenderAddress,
      MOCK_PADDED_FEE,
      currency,
      mockAsset,
      undefined
    )

    expect(result).toEqual({
      fee: MOCK_PADDED_FEE,
      asset: mockAsset,
      sufficient: true
    })
  })
})
