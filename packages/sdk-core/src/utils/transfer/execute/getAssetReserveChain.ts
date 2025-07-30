import type {
  TChainDotKsmWithRelayChains,
  TChainWithRelayChains,
  TEcosystemType
} from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  hasJunction,
  Parents,
  type TLocation
} from '@paraspell/sdk-common'

import { getTChain } from '../../../chains/getTChain'
import { CHAINS_DOT_RESERVE_AH } from '../../../constants'
import { InvalidParameterError } from '../../../errors'
import { getRelayChainOf } from '../..'

export const getAssetReserveChain = (
  chain: TChainDotKsmWithRelayChains,
  destChain: TChainWithRelayChains,
  assetLocation: TLocation
): TChainDotKsmWithRelayChains => {
  const hasGlobalConsensusJunction = hasJunction(assetLocation, 'GlobalConsensus')

  const paraId = getJunctionValue<number>(assetLocation, 'Parachain')
  if (paraId) {
    const resolvedChain = getTChain(paraId, getRelayChainOf(chain).toLowerCase() as TEcosystemType)
    if (!resolvedChain) {
      throw new InvalidParameterError(`Chain with paraId ${paraId} not found`)
    }
    return resolvedChain as TChainDotKsmWithRelayChains
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
