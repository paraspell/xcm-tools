import type { TChain } from '@paraspell/sdk-common'
import { hasJunction } from '@paraspell/sdk-common'

import { STABLECOIN_IDS } from '../../consts/consts'
import type { TAssetInfo } from '../../types'
import { getOtherAssets } from '../assets'
import { isStableCoinAsset } from '../isStableCoinAsset'

export const findStablecoinAssets = (chain: TChain): TAssetInfo[] => {
  const assets = getOtherAssets(chain)

  return STABLECOIN_IDS.map(id => {
    const matches = assets.filter(asset => isStableCoinAsset(asset, id))
    const consensusMatch = matches.find(asset => hasJunction(asset.location, 'GlobalConsensus'))
    return consensusMatch ?? matches[0]
  })
}
