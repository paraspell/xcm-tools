import type { TNodeDotKsmWithRelayChains } from '../types'
import { getNode } from './getNode'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import { getNodeProvider } from '../nodes/config'

export const createApiInstanceForNode = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodeDotKsmWithRelayChains
): Promise<TApi> => {
  if (node === 'Polkadot' || node === 'Kusama') {
    const wsUrl = getNodeProvider(node)
    return api.createApiInstance(wsUrl)
  }
  return getNode<TApi, TRes, typeof node>(node).createApiInstance(api)
}
