import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { getEdFromAssetOrThrow } from '@paraspell/assets'

import { getAssetBalanceInternal } from '../../balance'
import type { TBuildOriginInfoOptions, TOriginXcmFeeInfo, TSelectedCurrencyInfo } from '../../types'

export const buildOriginInfo = async <TApi, TRes, TSigner, TCustomChain extends string = never>({
  api,
  origin,
  sender,
  assets,
  amount,
  originFee,
  originFeeAsset,
  isFeeAssetAh
}: TBuildOriginInfoOptions<TApi, TRes, TSigner, TCustomChain>): Promise<{
  selectedCurrency: TSelectedCurrencyInfo[]
  xcmFee: TOriginXcmFeeInfo
}> => {
  const buildSelectedCurrency = async ({
    amount: assetAmount,
    ...asset
  }: WithAmount<TAssetInfo>): Promise<TSelectedCurrencyInfo> => {
    const balance = await getAssetBalanceInternal({
      api,
      address: sender,
      chain: origin,
      asset
    })

    const balanceAfter = balance - assetAmount

    return {
      sufficient: balanceAfter >= getEdFromAssetOrThrow(asset),
      balance,
      balanceAfter,
      asset
    }
  }

  const selectedCurrency = await Promise.all(assets.map(buildSelectedCurrency))

  const originBalanceFee = await getAssetBalanceInternal({
    api,
    address: sender,
    chain: origin,
    asset: originFeeAsset
  })

  const originBalanceFeeAfter = isFeeAssetAh
    ? originBalanceFee - amount
    : originBalanceFee - originFee

  return {
    selectedCurrency,
    xcmFee: {
      sufficient: originBalanceFee >= originFee,
      fee: originFee,
      balance: originBalanceFee,
      balanceAfter: originBalanceFeeAfter,
      asset: originFeeAsset
    }
  }
}
