import { prodRelayKusama, prodRelayPolkadot } from '@polkadot/apps-config'
import { TNodePolkadotKusama } from '../types'
import { getNode } from './getNode'

export const getNodeEndpointOption = (node: TNodePolkadotKusama) => {
  const { type, name } = getNode(node)
  const { linked } = type === 'polkadot' ? prodRelayPolkadot : prodRelayKusama

  if (linked === undefined) return undefined

  const preferredOption = linked.find(o => o.info === name && Object.values(o.providers).length > 0)

  return preferredOption ?? linked.find(o => o.info === name)
}
