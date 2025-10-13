import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'

export const createChainClient = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  chain: TSubstrateChain
): Promise<TApi> => {
  await api.init(chain)
  return api.getApi()
}
