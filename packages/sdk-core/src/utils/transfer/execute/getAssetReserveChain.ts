import type {
  TEcosystemType,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains
} from '@paraspell/sdk-common'
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
import { getRelayChainOf } from '../..'

export const getAssetReserveChain = (
  chain: TNodeDotKsmWithRelayChains,
  destChain: TNodeWithRelayChains,
  assetLocation: TMultiLocation
): TNodeDotKsmWithRelayChains => {
  const hasGlobalConsensusJunction = hasJunction(assetLocation, 'GlobalConsensus')

  const paraId = getJunctionValue<number>(assetLocation, 'Parachain')
  if (paraId) {
    const resolvedChain = getTNode(paraId, getRelayChainOf(chain).toLowerCase() as TEcosystemType)
    if (!resolvedChain) {
      throw new InvalidParameterError(`Chain with paraId ${paraId} not found`)
    }
    return resolvedChain as TNodeDotKsmWithRelayChains
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
    return CHAINS_DOT_RESERVE_AH.has(destChain) ? 'AssetHubPolkadot' : 'Polkadot'
  }

  return chain
}
