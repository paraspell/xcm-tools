import type { TAssetInfo } from '@paraspell/assets'
import { getOtherAssetsPallets } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import { pickOtherMintPallet } from '../asset'

export const isAssetSufficient = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TSubstrateChain | TCustomChain,
  asset: TAssetInfo
): Promise<boolean> => {
  const pallets = getOtherAssetsPallets(chain, api._customCtx)

  if (asset.isNative || pallets.length === 0) return true

  try {
    const state = await getPalletInstance(pickOtherMintPallet(asset, pallets)).getAssetState(
      api,
      asset
    )
    return state?.isSufficient ?? true
  } catch {
    return true
  }
}
