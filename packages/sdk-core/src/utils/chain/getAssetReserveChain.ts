import type { TChain, TRelaychain, TSubstrateChain } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  isRelayChain,
  Parents,
  type TLocation
} from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getTChain } from '../../chains/getTChain'
import { RoutingResolutionError } from '../../errors'
import { getRelayChainOf, getRelayChainOfImpl } from './getRelayChainOf'
const getAssetReserveChainInner = <TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  assetLocation: TLocation,
  resolveExternalReserve: boolean,
  resolveRelay: (chain: TSubstrateChain | TCustomChain) => TRelaychain
): TChain | TCustomChain => {
  const globalConsensus = getJunctionValue<Record<string, unknown>>(
    assetLocation,
    'GlobalConsensus'
  )

  if (resolveExternalReserve && globalConsensus && 'Ethereum' in globalConsensus) {
    const relaychain = resolveRelay(chain)
    return relaychain === 'Westend' || relaychain === 'Paseo' ? 'EthereumTestnet' : 'Ethereum'
  }

  const paraId = getJunctionValue<number>(assetLocation, 'Parachain')
  if (paraId) {
    const resolvedChain = getTChain(paraId, resolveRelay(chain))
    if (!resolvedChain) {
      throw new RoutingResolutionError(`Chain with paraId ${paraId} not found`)
    }
    return resolvedChain
  }

  if (isRelayChain(chain)) return chain

  const relaychain = resolveRelay(chain)
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

export const getAssetReserveChain = (
  chain: TSubstrateChain,
  assetLocation: TLocation,
  resolveExternalReserve = false
): TChain =>
  getAssetReserveChainInner<never>(chain, assetLocation, resolveExternalReserve, c =>
    getRelayChainOf(c)
  )

export const getAssetReserveChainImpl = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TSubstrateChain | TCustomChain,
  assetLocation: TLocation,
  resolveExternalReserve = false
): TChain | TCustomChain =>
  getAssetReserveChainInner<TCustomChain>(chain, assetLocation, resolveExternalReserve, c =>
    getRelayChainOfImpl(api, c)
  )
