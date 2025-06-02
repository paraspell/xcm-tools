import type { TPallet } from '@paraspell/pallets'
import { isRelayChain } from '@paraspell/sdk-common'

import { TX_CLIENT_TIMEOUT_MS } from '../../../constants'
import { type TAssetClaimOptions } from '../../../types/TAssetClaim'
import { validateAddress } from '../../../utils'
import { buildClaimAssetsInput } from './buildClaimAssetsInput'

export const claimAssets = async <TApi, TRes>(
  options: TAssetClaimOptions<TApi, TRes>
): Promise<TRes> => {
  const { api, node, address } = options

  validateAddress(address, node)

  await api.init(node, TX_CLIENT_TIMEOUT_MS)

  const args = buildClaimAssetsInput<TApi, TRes>(options)

  const module: TPallet = isRelayChain(node) ? 'XcmPallet' : 'PolkadotXcm'

  const call = {
    module,
    method: 'claim_assets',
    parameters: args
  }

  return api.callTxMethod(call)
}
