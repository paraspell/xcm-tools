import {
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  getExistentialDepositOrThrow
} from '@paraspell/assets'

import type { BuildHopInfoOptions, THopTransferInfo } from '../../types'

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
  hopApi.setDisconnectAllowed(false)

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
      } as THopTransferInfo['result']
    } else {
      const hopAsset = findAssetOnDestOrThrow(originChain, chain, currency)

      const ed = getExistentialDepositOrThrow(chain, { location: hopAsset.location })

      return {
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
