import { prodRelayKusama, prodRelayPolkadot } from '@polkadot/apps-config'
import type { TNodeWithRelayChains } from '../types'
import { getNode } from '.'

export const getNodeProvider = (node: TNodeWithRelayChains): string => {
  if (node === 'Polkadot') {
    return prodRelayPolkadot.providers[0]
  } else if (node === 'Kusama') {
    return prodRelayKusama.providers[0]
  }
  return getNode(node).getProvider()
}
