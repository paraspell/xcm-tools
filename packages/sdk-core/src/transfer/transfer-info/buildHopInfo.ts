import {
  findAssetOnDestOrThrow,
  getExistentialDeposit,
  getNativeAssetSymbol,
  isChainEvm
} from '@paraspell/assets'

import { InvalidParameterError } from '../../errors'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../../pallets/assets'
import type { BuildHopInfoOptions, TTransferInfo } from '../../types'

export const buildHopInfo = async <TApi, TRes>({
  api,
  chain,
  feeData,
  originChain,
  asset,
  currency,
  senderAddress,
  ahAddress
}: BuildHopInfoOptions<TApi, TRes>): Promise<TTransferInfo['assetHub']> => {
  const hopApi = api.clone()
  await hopApi.init(chain)
  hopApi.setDisconnectAllowed(false)

  try {
    const resolvedAddress = isChainEvm(originChain) && ahAddress ? ahAddress : senderAddress

    const nativeBalanceOnHop = await getBalanceNativeInternal({
      api: hopApi,
      address: resolvedAddress,
      chain
    })

    const nativeAssetSymbolOnHop = getNativeAssetSymbol(chain)

    const xcmFeeDetails = {
      fee: feeData.fee,
      balance: nativeBalanceOnHop,
      currencySymbol: nativeAssetSymbolOnHop,
      asset
    }

    const isBridgeHub = chain.includes('BridgeHub')

    if (isBridgeHub) {
      return {
        currencySymbol: getNativeAssetSymbol(chain),
        xcmFee: xcmFeeDetails
      } as TTransferInfo['assetHub']
    } else {
      const hopAsset = findAssetOnDestOrThrow(originChain, chain, currency)

      const hopCurrencyPayload = hopAsset.location
        ? { location: hopAsset.location }
        : { symbol: hopAsset.symbol }

      const balance = await getAssetBalanceInternal({
        api: hopApi,
        address: resolvedAddress,
        chain,
        currency: hopCurrencyPayload
      })

      const ed = getExistentialDeposit(chain, hopCurrencyPayload)
      if (!ed) {
        throw new InvalidParameterError(
          `Existential deposit not found for chain ${chain} with currency ${JSON.stringify(hopCurrencyPayload)}`
        )
      }

      return {
        balance: balance,
        currencySymbol: hopAsset.symbol,
        asset: hopAsset,
        existentialDeposit: BigInt(ed),
        xcmFee: xcmFeeDetails
      }
    }
  } finally {
    hopApi.setDisconnectAllowed(true)
    await hopApi.disconnect()
  }
}
