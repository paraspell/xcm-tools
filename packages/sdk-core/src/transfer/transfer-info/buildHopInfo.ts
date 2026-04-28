import { findAssetOnDestOrThrow, findNativeAssetInfoOrThrow } from '@paraspell/assets'

import type { BuildHopInfoOptions } from '../../types'

export const buildHopInfo = async <TApi, TRes, TSigner>({
  api,
  chain,
  fee,
  originChain,
  asset,
  currency
}: BuildHopInfoOptions<TApi, TRes, TSigner>) => {
  const hopApi = api.clone()
  await hopApi.init(chain)
  hopApi.disconnectAllowed = false

  try {
    const xcmFeeDetails = {
      fee,
      asset
    }

    const isBridgeHub = chain.includes('BridgeHub')

    if (isBridgeHub) {
      const nativeAsset = findNativeAssetInfoOrThrow(chain)
      return {
        asset: nativeAsset,
        xcmFee: xcmFeeDetails
      }
    } else {
      const hopAsset = findAssetOnDestOrThrow(originChain, chain, currency)

      return {
        asset: hopAsset,
        xcmFee: xcmFeeDetails
      }
    }
  } finally {
    hopApi.disconnectAllowed = true
    await hopApi.disconnect()
  }
}
