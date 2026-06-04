import { getExistentialDepositOrThrow } from '@paraspell/assets'

import { getAssetBalanceInternal } from '../../balance'
import type { TBuildOriginInfoOptions, TTransferInfo } from '../../types'

export const buildOriginInfo = async <TApi, TRes, TSigner, TCustomChain extends string = never>({
  api,
  origin,
  sender,
  currency,
  originAsset,
  amount,
  originFee,
  originFeeAsset,
  isFeeAssetAh
}: TBuildOriginInfoOptions<TApi, TRes, TSigner, TCustomChain>): Promise<
  TTransferInfo['origin']
> => {
  const originBalance = await getAssetBalanceInternal({
    api,
    address: sender,
    chain: origin,
    asset: originAsset
  })

  const edOrigin = getExistentialDepositOrThrow(origin, currency)

  const originBalanceFee = await getAssetBalanceInternal({
    api,
    address: sender,
    chain: origin,
    asset: originFeeAsset
  })

  const originBalanceAfter = originBalance - amount

  const originBalanceFeeAfter = isFeeAssetAh
    ? originBalanceFee - amount
    : originBalanceFee - originFee

  const originBalanceNativeSufficient = originBalanceFee >= originFee
  const originBalanceSufficient = originBalanceAfter >= edOrigin

  return {
    selectedCurrency: {
      sufficient: originBalanceSufficient,
      balance: originBalance,
      balanceAfter: originBalanceAfter,
      asset: originAsset
    },
    xcmFee: {
      sufficient: originBalanceNativeSufficient,
      fee: originFee,
      balance: originBalanceFee,
      balanceAfter: originBalanceFeeAfter,
      asset: originFeeAsset
    }
  }
}
