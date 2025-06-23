import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  hasJunction,
  Parents,
  type TMultiLocation
} from '@paraspell/sdk-common'

import { CHAINS_DOT_RESERVE_AH } from '../../../constants'
import { InvalidParameterError } from '../../../errors'
import { getTNode } from '../../../nodes/getTNode'
import { determineRelayChain } from '../..'

export const getAssetReserveChain = (
  origin: TNodeDotKsmWithRelayChains,
  assetLocation: TMultiLocation
): TNodeDotKsmWithRelayChains => {
  const hasGlobalConsensusJunction = hasJunction(assetLocation, 'GlobalConsensus')

  const paraId = getJunctionValue<number>(assetLocation, 'Parachain')
  if (paraId) {
    const chain = getTNode(
      paraId,
      determineRelayChain(origin) === 'Polkadot' ? 'polkadot' : 'kusama'
    )
    if (!chain) {
      throw new InvalidParameterError(`Chain with paraId ${paraId} not found`)
    }
    return chain as TNodeDotKsmWithRelayChains
  }

  if (hasGlobalConsensusJunction) {
    return 'AssetHubPolkadot'
  }

  if (
    deepEqual(assetLocation, {
      parents: Parents.ONE,
      interior: { Here: null }
    })
  ) {
    return CHAINS_DOT_RESERVE_AH.has(origin) ? 'AssetHubPolkadot' : 'Polkadot'
  }

  return origin
}
