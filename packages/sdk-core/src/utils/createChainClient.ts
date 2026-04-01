import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api/PolkadotApi'

export const createChainClient = async <TApi, TRes, TSigner>(
  api: PolkadotApi<TApi, TRes, TSigner>,
  chain: TSubstrateChain
): Promise<TApi> => {
  await api.init(chain)
  return api.api
}
