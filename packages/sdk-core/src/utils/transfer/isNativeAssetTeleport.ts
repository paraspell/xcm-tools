import { isAssetEqual, type TAssetInfo } from '@paraspell/assets'
import { isExternalChain, type TChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'

export const isNativeAssetTeleport = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  origin: TChain | TCustomChain,
  dest: TChain | TCustomChain,
  asset: TAssetInfo
): boolean => {
  if (isExternalChain(origin) || isExternalChain(dest)) return false

  const isOriginAh = origin.includes('AssetHub')
  const isDestAh = dest.includes('AssetHub')

  if (isOriginAh === isDestAh) return false

  const para = isDestAh ? origin : dest

  return isAssetEqual(api.findNativeAssetInfoOrThrow(para), asset)
}
