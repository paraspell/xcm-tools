import type { TNodeDotKsmWithRelayChains } from '../types'
import { prodRelayKusama, prodRelayPolkadot } from '@polkadot/apps-config'
import { getNode } from './getNode'
import type { IPolkadotApi } from '../api/IPolkadotApi'

export const createApiInstanceForNode = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodeDotKsmWithRelayChains
): Promise<TApi> => {
  if (node === 'Polkadot' || node === 'Kusama') {
    const endpointOption = node === 'Polkadot' ? prodRelayPolkadot : prodRelayKusama
    const wsUrl = Object.values(endpointOption.providers)[0]
    return await api.createApiInstance(wsUrl)
  }
  return await getNode<TApi, TRes, typeof node>(node).createApiInstance(api)
}
