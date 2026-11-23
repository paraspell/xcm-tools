import { isAssetEqual } from '@paraspell/assets'

import type { TCreateSwapXcmOptions, TSwapFeeEstimates } from '../../../types'

const scaleFeeToPostTradePrice = (
  fee: bigint,
  soldAmount: bigint,
  nativeForFee: bigint,
  nativeForSoldAmount: bigint
) => {
  const spotToAverageNumerator = nativeForFee * soldAmount
  const spotToAverageDenominator = fee * nativeForSoldAmount
  const postTradeFee =
    (fee * spotToAverageNumerator * spotToAverageNumerator) /
    (spotToAverageDenominator * spotToAverageDenominator)

  return postTradeFee > fee ? postTradeFee : fee
}

/**
 * AssetHub pays the onward delivery fee from the sold asset after the swap moved the pool price,
 * so the pre-trade fee estimate is scaled to the post-trade price to avoid NotHoldingFees.
 */
export const getExchangeFeeAtPostTradePrice = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  {
    api,
    chain,
    exchangeChain,
    destChain,
    assetInfoFrom,
    calculateMinAmountOut
  }: TCreateSwapXcmOptions<TApi, TRes, TSigner, TCustomChain>,
  { originReserveFee, exchangeFee }: TSwapFeeEstimates,
  hasSeparateFeeAsset: boolean
) => {
  const nativeAsset = api.findNativeAssetInfoOrThrow(exchangeChain)

  const isOnwardFeeTakenFromSoldAsset =
    chain !== undefined &&
    destChain !== undefined &&
    !hasSeparateFeeAsset &&
    exchangeChain.includes('AssetHub') &&
    !isAssetEqual(assetInfoFrom, nativeAsset)

  if (!isOnwardFeeTakenFromSoldAsset) return exchangeFee

  const soldAmount = assetInfoFrom.amount - originReserveFee - exchangeFee

  const [nativeForFee, nativeForSoldAmount] = await Promise.all([
    calculateMinAmountOut(exchangeFee, nativeAsset, '0'),
    calculateMinAmountOut(soldAmount, nativeAsset, '0')
  ])

  if (nativeForSoldAmount === 0n) return exchangeFee

  return scaleFeeToPostTradePrice(exchangeFee, soldAmount, nativeForFee, nativeForSoldAmount)
}
