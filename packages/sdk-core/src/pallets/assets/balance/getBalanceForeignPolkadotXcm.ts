import { type TAssetInfo } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { hasJunction } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { assertHasId, assertHasLocation, assertIsForeign } from '../../../utils'
import { getMoonbeamErc20Balance } from './getMoonbeamErc20Balance'

export const getBalanceForeignPolkadotXcm = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  chain: TSubstrateChain,
  address: string,
  asset: TAssetInfo
): Promise<bigint> => {
  if (chain === 'Moonbeam' || chain === 'Moonriver') {
    assertHasId(asset)
    return getMoonbeamErc20Balance(chain, asset.assetId, address)
  }

  if (chain === 'Mythos') {
    return api.getMythosForeignBalance(address)
  }

  assertIsForeign(asset)

  if (chain === 'Polimec') {
    assertHasLocation(asset)

    return api.getBalanceForeignAssetsPallet(address, asset.location)
  }

  if (chain.startsWith('AssetHub')) {
    const ASSETS_PALLET_ID = 50

    const hasRequiredJunctions =
      asset.location &&
      hasJunction(asset.location, 'PalletInstance', ASSETS_PALLET_ID) &&
      hasJunction(asset.location, 'GeneralIndex')

    if (!asset.location || hasRequiredJunctions) {
      return api.getBalanceAssetsPallet(address, Number(asset.assetId))
    }

    return api.getBalanceForeignAssetsPallet(address, asset.location)
  }

  return api.getBalanceForeignPolkadotXcm(chain, address, asset)
}
