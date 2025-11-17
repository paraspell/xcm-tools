import { getSupportedPallets } from '@paraspell/pallets'

import { TX_CLIENT_TIMEOUT_MS } from '../../constants'
import { InvalidParameterError } from '../../errors'
import type { TAssetClaimOptions } from '../../types'
import { getChainVersion, validateAddress } from '../../utils'
import { buildClaimAssetsParams } from './buildClaimAssetsParams'
import { resolveAssets } from './resolveAssets'

export const claimAssets = async <TApi, TRes>(
  options: TAssetClaimOptions<TApi, TRes>
): Promise<TRes> => {
  const { api, chain, address } = options

  validateAddress(api, address, chain, true)

  await api.init(chain, TX_CLIENT_TIMEOUT_MS)

  const pallets = getSupportedPallets(chain)

  const supportedPallet = pallets.find(p => p === 'PolkadotXcm' || p === 'XcmPallet')

  if (!supportedPallet) {
    throw new InvalidParameterError('Unsupported pallet for asset claim')
  }

  const version = getChainVersion(chain)

  const assets = resolveAssets(options, version)

  const params = buildClaimAssetsParams<TApi, TRes>({
    ...options,
    version,
    assets
  })

  const call = {
    module: supportedPallet,
    method: 'claim_assets',
    params
  }

  return api.deserializeExtrinsics(call)
}
