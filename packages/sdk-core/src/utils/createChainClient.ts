import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { getChainProviders } from '../chains/config'

export const createChainClient = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  chain: TSubstrateChain
): Promise<TApi> => {
  const wsUrl = getChainProviders(chain)
  return api.createApiInstance(wsUrl, chain)
}
