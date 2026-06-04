import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api/PolkadotApi'

export const createChainClient = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TSubstrateChain
): Promise<TApi> => {
  await api.init(chain)
  return api.api
}
