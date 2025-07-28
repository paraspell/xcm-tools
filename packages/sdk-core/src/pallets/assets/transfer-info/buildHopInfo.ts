import type { TCurrencyCore } from '@paraspell/assets'
import {
  findAssetOnDestOrThrow,
  getExistentialDeposit,
  getNativeAssetSymbol,
  isNodeEvm
} from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../../api'
import { InvalidParameterError } from '../../../errors'
import type { TTransferInfo } from '../../../types'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'

export type BuildHopInfoOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  node: TNodeDotKsmWithRelayChains
  feeData: {
    fee: bigint
    currency: string
  }
  originNode: TNodeDotKsmWithRelayChains
  currency: TCurrencyCore
  senderAddress: string
  ahAddress?: string
}

export const buildHopInfo = async <TApi, TRes>({
  api,
  node,
  feeData,
  originNode,
  currency,
  senderAddress,
  ahAddress
}: BuildHopInfoOptions<TApi, TRes>): Promise<TTransferInfo['assetHub']> => {
  const hopApi = api.clone()
  await hopApi.init(node)
  hopApi.setDisconnectAllowed(false)

  try {
    const resolvedAddress = isNodeEvm(originNode) && ahAddress ? ahAddress : senderAddress

    const nativeBalanceOnHop = await getBalanceNativeInternal({
      api: hopApi,
      address: resolvedAddress,
      node: node
    })

    const nativeAssetSymbolOnHop = getNativeAssetSymbol(node)

    const xcmFeeDetails = {
      fee: feeData.fee,
      balance: nativeBalanceOnHop,
      currencySymbol: nativeAssetSymbolOnHop
    }

    const isBridgeHubNode = node.includes('BridgeHub')

    if (isBridgeHubNode) {
      return {
        currencySymbol: getNativeAssetSymbol(node),
        xcmFee: xcmFeeDetails
      } as TTransferInfo['assetHub']
    } else {
      const hopAsset = findAssetOnDestOrThrow(originNode, node, currency)

      const hopCurrencyPayload = hopAsset.location
        ? { location: hopAsset.location }
        : { symbol: hopAsset.symbol }

      const balance = await getAssetBalanceInternal({
        api: hopApi,
        address: resolvedAddress,
        node: node,
        currency: hopCurrencyPayload
      })

      const ed = getExistentialDeposit(node, hopCurrencyPayload)
      if (!ed) {
        throw new InvalidParameterError(
          `Existential deposit not found for node ${node} with currency ${JSON.stringify(hopCurrencyPayload)}`
        )
      }

      return {
        balance: balance,
        currencySymbol: hopAsset.symbol,
        existentialDeposit: BigInt(ed),
        xcmFee: xcmFeeDetails
      }
    }
  } finally {
    hopApi.setDisconnectAllowed(true)
    await hopApi.disconnect()
  }
}
