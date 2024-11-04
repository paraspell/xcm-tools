import type { TPallet } from '../../../types'
import { type TSerializedApiCall } from '../../../types'
import { type TAssetClaimOptions } from '../../../types/TAssetClaim'
import { isRelayChain } from '../../../utils'
import { buildClaimAssetsInput } from './buildClaimAssetsInput'

export const claimAssets = async <TApi, TRes>(
  options: TAssetClaimOptions<TApi, TRes>
): Promise<TRes | TSerializedApiCall> => {
  const { api, node, serializedApiCallEnabled } = options

  await api.init(node)

  const args = buildClaimAssetsInput<TApi, TRes>(options)

  const module: TPallet = isRelayChain(node) ? 'XcmPallet' : 'PolkadotXcm'

  const call = {
    module,
    section: 'claim_assets',
    parameters: args
  }

  if (serializedApiCallEnabled === true) {
    return {
      ...call,
      // Keep compatible with the old SerializedCall type
      parameters: Object.values(args)
    }
  }

  return api.callTxMethod(call)
}