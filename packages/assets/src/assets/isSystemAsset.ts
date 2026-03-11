import type { TRelaychain } from '@paraspell/sdk-common'
import { deepEqual, getJunctionValue, Parents, RELAYCHAINS } from '@paraspell/sdk-common'

import type { TAssetInfo } from '../types'

export const isSystemAsset = (asset: TAssetInfo) =>
  deepEqual(asset.location, { parents: Parents.ONE, interior: { Here: null } }) ||
  isBridgedSystemAsset(asset, RELAYCHAINS)

export const isBridgedSystemAsset = (asset: TAssetInfo, relayChains: readonly TRelaychain[]) =>
  asset.location.parents === Parents.TWO &&
  relayChains.some(relayChain =>
    deepEqual(getJunctionValue(asset.location, 'GlobalConsensus'), {
      [relayChain.toLowerCase()]: null
    })
  )
