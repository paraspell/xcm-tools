import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { isAssetEqual } from '@paraspell/assets'

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
  isOriginFeeAsset
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
      sufficient: balanceAfter >= BigInt(asset.existentialDeposit),
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

  const transferredFeeAsset = isOriginFeeAsset
    ? undefined
    : assets.find(asset => isAssetEqual(asset, originFeeAsset))

  const originBalanceFeeAfter = isOriginFeeAsset
    ? originBalanceFee - amount
    : originBalanceFee - originFee - (transferredFeeAsset?.amount ?? 0n)

  const ed = BigInt(originFeeAsset.existentialDeposit)
  const isNativeFeeAsset = isAssetEqual(originFeeAsset, api.findNativeAssetInfoOrThrow(origin))
  const remaining = originBalanceFeeAfter + (isNativeFeeAsset ? ed : 0n)

  return {
    selectedCurrency,
    xcmFee: {
      sufficient: transferredFeeAsset
        ? remaining === 0n || remaining >= ed
        : originBalanceFee >= originFee,
      fee: originFee,
      balance: originBalanceFee,
      balanceAfter: originBalanceFeeAfter,
      asset: originFeeAsset
    }
  }
}
