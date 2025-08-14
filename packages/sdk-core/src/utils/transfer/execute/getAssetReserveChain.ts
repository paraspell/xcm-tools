import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
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
  chain: TSubstrateChain,
  destChain: TChain,
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
