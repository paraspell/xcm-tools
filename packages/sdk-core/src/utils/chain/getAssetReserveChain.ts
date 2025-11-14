import type { TSubstrateChain } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  hasJunction,
  isRelayChain,
  Parents,
  type TLocation
} from '@paraspell/sdk-common'

import { getRelayChainOf, getTChain } from '../..'
import { InvalidParameterError } from '../../errors'

export const getAssetReserveChain = (
  chain: TSubstrateChain,
  assetLocation: TLocation
): TSubstrateChain => {
  const hasGlobalConsensusJunction = hasJunction(assetLocation, 'GlobalConsensus')

  const paraId = getJunctionValue<number>(assetLocation, 'Parachain')
  if (paraId) {
    const resolvedChain = getTChain(paraId, getRelayChainOf(chain))
    if (!resolvedChain) {
      throw new InvalidParameterError(`Chain with paraId ${paraId} not found`)
    }
    return resolvedChain as TSubstrateChain
  }

  if (isRelayChain(chain)) return chain

  const relaychain = getRelayChainOf(chain)
  const ahChain = `AssetHub${relaychain}` as TSubstrateChain

  if (hasGlobalConsensusJunction) {
    return ahChain
  }

  if (
    deepEqual(assetLocation, {
      parents: Parents.ONE,
      interior: { Here: null }
    })
  ) {
    return ahChain
  }

  return chain
}
