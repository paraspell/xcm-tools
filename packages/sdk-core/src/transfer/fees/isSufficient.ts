import type { TAssetInfo, TCurrencyCore, WithComplexAmount } from '@paraspell/assets'
import {
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
  isSymbolMatch
} from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { getAssetBalance, getBalanceNativeInternal } from '../../pallets/assets'

export const isSufficientOrigin = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  origin: TSubstrateChain,
  destination: TChain,
  senderAddress: string,
  feeNative: bigint,
  currency: WithComplexAmount<TCurrencyCore>,
  asset: TAssetInfo,
  feeAsset: TAssetInfo | undefined
): Promise<boolean | undefined> => {
  if (feeAsset) {
    return undefined
  }

  const edNative = getExistentialDepositOrThrow(origin)

  const balanceNative = await getBalanceNativeInternal({
    api,
    chain: origin,
    address: senderAddress
  })

  const isNativeAssetToOrigin = isSymbolMatch(asset.symbol, getNativeAssetSymbol(origin))
  const isNativeAssetToDest = isSymbolMatch(asset.symbol, getNativeAssetSymbol(destination))

  if (isNativeAssetToOrigin && isNativeAssetToDest) {
    return balanceNative - edNative - feeNative - BigInt(currency.amount) > 0n
  }

  if (!isNativeAssetToOrigin) {
    const isSufficientNative = balanceNative - edNative - feeNative > 0n

    const balanceAsset = await getAssetBalance({
      api,
      chain: origin,
      address: senderAddress,
      currency
    })

    const edAsset = getExistentialDepositOrThrow(origin, currency)

    const isSufficientAsset = balanceAsset - edAsset > 0n

    return isSufficientNative && isSufficientAsset
  } else {
    return balanceNative - edNative - feeNative - BigInt(currency.amount) > 0n
  }
}

export const isSufficientDestination = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  destination: TChain,
  address: string,
  amount: bigint,
  asset: TAssetInfo,
  feeNative: bigint
): Promise<boolean | undefined> => {
  const isNativeAsset = isSymbolMatch(asset.symbol, getNativeAssetSymbol(destination))

  if (!isNativeAsset) {
    return undefined
  }

  const existentialDeposit = getExistentialDepositOrThrow(destination)

  const nativeBalance = await getBalanceNativeInternal({
    api,
    chain: destination,
    address: address
  })

  return nativeBalance + amount - existentialDeposit - feeNative > 0n
}
