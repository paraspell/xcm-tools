import type { TPallet } from '../../../types'
import { type TAssetClaimOptions } from '../../../types/TAssetClaim'
import { isRelayChain } from '../../../utils'
import { isPjsClient } from '../../../utils/isPjsClient'
import { buildClaimAssetsInput } from './buildClaimAssetsInput'

export const claimAssets = async <TApi, TRes>(
  options: TAssetClaimOptions<TApi, TRes>
): Promise<TRes> => {
  const { api, node } = options

  await api.init(node)

  try {
    const args = buildClaimAssetsInput<TApi, TRes>(options)

    const module: TPallet = isRelayChain(node) ? 'XcmPallet' : 'PolkadotXcm'

    const call = {
      module,
      section: 'claim_assets',
      parameters: args
    }

    return api.callTxMethod(call)
  } finally {
    if (isPjsClient(api.getApi())) {
      await api.disconnect()
    }
  }
}
