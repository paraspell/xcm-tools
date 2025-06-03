import type { TAsset } from '@paraspell/assets'
import {
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
  normalizeSymbol
} from '@paraspell/assets'
import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { getBalanceNativeInternal } from '../../pallets/assets'

export const isSufficientOrigin = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodeWithRelayChains,
  senderAddress: string,
  fee: bigint
): Promise<boolean> => {
  const existentialDeposit = getExistentialDepositOrThrow(node)

  const nativeBalance = await getBalanceNativeInternal({
    api,
    node,
    address: senderAddress
  })

  return nativeBalance - existentialDeposit - fee > 0n
}

export const isSufficientDestination = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  destination: TNodeWithRelayChains,
  address: string,
  amount: bigint,
  asset: TAsset
): Promise<boolean | undefined> => {
  if (normalizeSymbol(asset.symbol) !== normalizeSymbol(getNativeAssetSymbol(destination))) {
    return undefined
  }

  const existentialDeposit = getExistentialDepositOrThrow(destination)

  const nativeBalance = await getBalanceNativeInternal({
    api,
    node: destination,
    address: address
  })

  return nativeBalance + amount - existentialDeposit > 0n
}
