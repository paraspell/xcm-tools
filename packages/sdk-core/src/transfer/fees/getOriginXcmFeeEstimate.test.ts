import { getNativeAssetSymbol } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TGetOriginXcmFeeEstimateOptions, TGetXcmFeeEstimateDetail } from '../../types'
import { getOriginXcmFeeEstimate } from './getOriginXcmFeeEstimate'
import { isSufficientOrigin } from './isSufficient'
import { padFee } from './padFee'

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./padFee', () => ({
  padFee: vi.fn()
}))

vi.mock('./isSufficient', () => ({
  isSufficientOrigin: vi.fn()
}))

describe('getOriginXcmFeeEstimate', () => {
  const mockApi = {
    calculateTransactionFee: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>
  const mockTx = {} as unknown
  const mockSenderAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
  const mockOriginNode = 'origin' as TNodeDotKsmWithRelayChains
  const mockDestinationNode = 'destination' as TNodeDotKsmWithRelayChains

  const MOCK_RAW_FEE = 100000000000n
  const MOCK_PADDED_FEE = 120000000000n
  const MOCK_NATIVE_ASSET_SYMBOL = 'DOT'

  it('should correctly calculate and return the origin XCM fee estimate including sufficiency', async () => {
    vi.mocked(padFee).mockReturnValue(MOCK_PADDED_FEE)
    vi.mocked(getNativeAssetSymbol).mockReturnValue(MOCK_NATIVE_ASSET_SYMBOL)
    vi.mocked(isSufficientOrigin).mockResolvedValue(true)
    const spy = vi.spyOn(mockApi, 'calculateTransactionFee').mockResolvedValue(MOCK_RAW_FEE)

    const options: TGetOriginXcmFeeEstimateOptions<unknown, unknown> = {
      api: mockApi,
      tx: mockTx,
      origin: mockOriginNode,
      destination: mockDestinationNode,
      senderAddress: mockSenderAddress
    }

    const result: TGetXcmFeeEstimateDetail = await getOriginXcmFeeEstimate(options)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(mockTx, mockSenderAddress)

    expect(padFee).toHaveBeenCalledTimes(1)
    expect(padFee).toHaveBeenCalledWith(MOCK_RAW_FEE, mockOriginNode, mockDestinationNode, 'origin')

    expect(isSufficientOrigin).toHaveBeenCalledTimes(1)
    expect(isSufficientOrigin).toHaveBeenCalledWith(
      mockApi,
      mockOriginNode,
      mockSenderAddress,
      MOCK_PADDED_FEE
    )

    expect(getNativeAssetSymbol).toHaveBeenCalledTimes(1)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockOriginNode)

    expect(result).toEqual({
      fee: MOCK_PADDED_FEE,
      currency: MOCK_NATIVE_ASSET_SYMBOL,
      sufficient: true
    })
  })
})
