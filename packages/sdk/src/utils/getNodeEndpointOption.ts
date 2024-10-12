import { prodRelayKusama, prodRelayPolkadot } from '@polkadot/apps-config'
import type { TNodePolkadotKusama } from '../types'
import { getNode } from './getNode'

/**
 * Retrieves the endpoint option for a given Polkadot or Kusama node.
 *
 * @param node - The Polkadot or Kusama node for which to get the endpoint option.
 * @returns The endpoint option object if found; otherwise, undefined.
 */
export const getNodeEndpointOption = (node: TNodePolkadotKusama) => {
  const { type, name } = getNode(node)
  const { linked } = type === 'polkadot' ? prodRelayPolkadot : prodRelayKusama

  if (linked === undefined) return undefined

  const preferredOption = linked.find(o => o.info === name && Object.values(o.providers).length > 0)

  return preferredOption ?? linked.find(o => o.info === name)
}
