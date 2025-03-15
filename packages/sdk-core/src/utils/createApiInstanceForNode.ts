import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { getNodeProviders } from '../nodes/config'
import { shuffleWsProviders } from './shuffleWsProviders'

export const createApiInstanceForNode = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodeDotKsmWithRelayChains
): Promise<TApi> => {
  const wsUrl = getNodeProviders(node)
  const resolvedWsUrl = Array.isArray(wsUrl) ? shuffleWsProviders(node, wsUrl) : wsUrl
  return api.createApiInstance(resolvedWsUrl)
}
