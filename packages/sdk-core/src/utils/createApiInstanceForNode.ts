import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { getNodeProviders } from '../nodes/config'

export const createApiInstanceForNode = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodeDotKsmWithRelayChains
): Promise<TApi> => {
  const wsUrl = getNodeProviders(node)
  return api.createApiInstance(wsUrl)
}
