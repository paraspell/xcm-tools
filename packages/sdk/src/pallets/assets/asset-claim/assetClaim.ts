import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic, TApiType, TResType } from '../../../types'
import { type TSerializedApiCall } from '../../../types'
import { type TAssetClaimOptions } from '../../../types/TAssetClaim'
import { createApiInstanceForNode, isRelayChain } from '../../../utils'
import { buildClaimAssetsInput } from './buildClaimAssetsInput'

const MODULE = 'polkadotXcm'
const MODULE_RELAY = 'xcmPallet'
const SECTION = 'claimAssets'

export const claimAssets = async <
  TApi extends TApiType = ApiPromise,
  TRes extends TResType = Extrinsic
>(
  options: TAssetClaimOptions<TApi>
): Promise<TRes | TSerializedApiCall> => {
  const { api, node, serializedApiCallEnabled } = options

  const apiWithFallback = api ?? (await createApiInstanceForNode(node))

  const args = buildClaimAssetsInput({
    ...options,
    api: apiWithFallback
  })

  const module = isRelayChain(node) ? MODULE_RELAY : MODULE

  if (serializedApiCallEnabled === true) {
    return {
      module,
      section: SECTION,
      parameters: args
    }
  }

  return apiWithFallback.tx[module][SECTION](...args) as TRes
}
