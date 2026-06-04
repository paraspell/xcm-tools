import type { TAssetInfo, TCurrencyCore, WithComplexAmount } from '@paraspell/assets'
import {
  getEdFromAssetOrThrow,
  getExistentialDepositOrThrowImpl,
  getNativeAssetSymbolImpl,
  isSymbolMatch
} from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getAssetBalanceInternal, getBalanceInternal } from '../../balance'

export const isSufficientOrigin = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  origin: TSubstrateChain | TCustomChain,
  destination: TChain,
  sender: string,
  feeNative: bigint,
  currency: WithComplexAmount<TCurrencyCore>,
  asset: TAssetInfo,
  feeAsset: TAssetInfo | undefined
): Promise<boolean | undefined> => {
  if (feeAsset) return undefined

  const edNative = getExistentialDepositOrThrowImpl(origin, undefined, api._customCtx)

  const balanceNative = await getBalanceInternal({
    api,
    chain: origin,
    address: sender
  })

  const isNativeAssetToOrigin = isSymbolMatch(
    asset.symbol,
    getNativeAssetSymbolImpl(origin, api._customCtx)
  )
  const isNativeAssetToDest = isSymbolMatch(
    asset.symbol,
    getNativeAssetSymbolImpl(destination, api._customCtx)
  )

  if (isNativeAssetToOrigin && isNativeAssetToDest) {
    return balanceNative - edNative - feeNative - BigInt(currency.amount) > 0n
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
    return balanceNative - edNative - feeNative - BigInt(currency.amount) > 0n
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
  amount: bigint,
  asset: TAssetInfo,
  feeNative: bigint
): Promise<boolean | undefined> => {
  const isNativeAsset = isSymbolMatch(
    asset.symbol,
    getNativeAssetSymbolImpl(destination, api._customCtx)
  )

  if (!isNativeAsset) return undefined

  const existentialDeposit = getExistentialDepositOrThrowImpl(
    destination,
    undefined,
    api._customCtx
  )

  const nativeBalance = await getBalanceInternal({
    api,
    chain: destination,
    address
  })

  return nativeBalance + amount - existentialDeposit - feeNative > 0n
}
