import {
  findAssetOnDestOrThrow,
  getExistentialDepositOrThrow,
  getNativeAssetSymbol
} from '@paraspell/assets'

import type { BuildHopInfoOptions, TTransferInfo } from '../../types'

export const buildHopInfo = async <TApi, TRes>({
  api,
  chain,
  feeData,
  originChain,
  asset,
  currency
}: BuildHopInfoOptions<TApi, TRes>) => {
  const hopApi = api.clone()
  await hopApi.init(chain)
  hopApi.setDisconnectAllowed(false)

  try {
    const xcmFeeDetails = {
      fee: feeData.fee,
      currencySymbol: asset.symbol,
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

      const ed = getExistentialDepositOrThrow(chain, hopCurrencyPayload)

      return {
        currencySymbol: hopAsset.symbol,
        asset: hopAsset,
        existentialDeposit: ed,
        xcmFee: xcmFeeDetails
      }
    }
  } finally {
    hopApi.setDisconnectAllowed(true)
    await hopApi.disconnect()
  }
}
