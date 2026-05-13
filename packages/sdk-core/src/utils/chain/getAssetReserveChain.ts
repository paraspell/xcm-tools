import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  isRelayChain,
  Parents,
  type TLocation
} from '@paraspell/sdk-common'

import { getRelayChainOf, getTChain } from '../..'
import { RoutingResolutionError } from '../../errors'

export const getAssetReserveChain = (
  chain: TSubstrateChain,
  assetLocation: TLocation,
  resolveExternalReserve = false
): TChain => {
  const globalConsensus = getJunctionValue<Record<string, unknown>>(
    assetLocation,
    'GlobalConsensus'
  )

  if (resolveExternalReserve && globalConsensus && 'Ethereum' in globalConsensus) {
    const relaychain = getRelayChainOf(chain)
    return relaychain === 'Westend' || relaychain === 'Paseo' ? 'EthereumTestnet' : 'Ethereum'
  }

  const paraId = getJunctionValue<number>(assetLocation, 'Parachain')
  if (paraId) {
    const resolvedChain = getTChain(paraId, getRelayChainOf(chain))
    if (!resolvedChain) {
      throw new RoutingResolutionError(`Chain with paraId ${paraId} not found`)
    }
    return resolvedChain
  }

  if (isRelayChain(chain)) return chain

  const relaychain = getRelayChainOf(chain)
  const ahChain: TSubstrateChain = `AssetHub${relaychain}`

  if (globalConsensus) {
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
