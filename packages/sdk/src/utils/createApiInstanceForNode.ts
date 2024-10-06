import type { ApiPromise } from '@polkadot/api'
import type { TNodeWithRelayChains } from '../types'
import { prodRelayKusama, prodRelayPolkadot } from '@polkadot/apps-config'
import { createApiInstance, getNode } from '.'

export const createApiInstanceForNode = async (node: TNodeWithRelayChains): Promise<ApiPromise> => {
  if (node === 'Polkadot' || node === 'Kusama') {
    const endpointOption = node === 'Polkadot' ? prodRelayPolkadot : prodRelayKusama
    const wsUrl = Object.values(endpointOption.providers)[0]
    return await createApiInstance(wsUrl)
  }
  return await getNode(node).createApiInstance()
}
