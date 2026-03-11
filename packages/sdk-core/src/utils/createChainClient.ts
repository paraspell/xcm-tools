import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'

export const createChainClient = async <TApi, TRes, TSigner>(
  api: IPolkadotApi<TApi, TRes, TSigner>,
  chain: TSubstrateChain
): Promise<TApi> => {
  await api.init(chain)
  return api.getApi()
}
