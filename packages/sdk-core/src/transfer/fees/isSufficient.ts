import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { getEdFromAssetOrThrow, isSymbolMatch } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getAssetBalanceInternal, getBalanceInternal } from '../../balance'

export const isSufficientOrigin = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  origin: TSubstrateChain | TCustomChain,
  destination: TChain,
  sender: string,
  feeNative: bigint,
  asset: WithAmount<TAssetInfo>,
  feeAsset: TAssetInfo | undefined
): Promise<boolean | undefined> => {
  if (feeAsset) return undefined

  const edNative = api.getExistentialDepositOrThrow(origin)

  const balanceNative = await getBalanceInternal({
    api,
    chain: origin,
    address: sender
  })

  const isNativeAssetToOrigin = isSymbolMatch(asset.symbol, api.getNativeAssetSymbol(origin))
  const isNativeAssetToDest = isSymbolMatch(asset.symbol, api.getNativeAssetSymbol(destination))

  if (isNativeAssetToOrigin && isNativeAssetToDest) {
    return balanceNative - edNative - feeNative - asset.amount > 0n
  }

  if (!isNativeAssetToOrigin) {
    const isSufficientNative = balanceNative - edNative - feeNative > 0n

    const balanceAsset = await getAssetBalanceInternal({
      api,
      chain: origin,
      address: sender,
      asset
    })

    const edAsset = getEdFromAssetOrThrow(asset)

    const isSufficientAsset = balanceAsset - edAsset > 0n

    return isSufficientNative && isSufficientAsset
  } else {
    return balanceNative - edNative - feeNative - asset.amount > 0n
  }
}

export const isSufficientDestination = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  destination: TChain,
  address: string,
  asset: WithAmount<TAssetInfo>,
  feeNative: bigint
): Promise<boolean | undefined> => {
  const isNativeAsset = isSymbolMatch(asset.symbol, api.getNativeAssetSymbol(destination))

  if (!isNativeAsset) return undefined

  const existentialDeposit = api.getExistentialDepositOrThrow(destination)

  const nativeBalance = await getBalanceInternal({
    api,
    chain: destination,
    address
  })

  return nativeBalance + asset.amount - existentialDeposit - feeNative > 0n
}
