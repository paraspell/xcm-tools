import type { TSubstrateChain } from '@paraspell/sdk-common'

import { getChainProviders } from '../chains/config'
import { MissingChainApiError } from '../errors'
import type { TApiOrUrl, TBuilderOptions, TUrl } from '../types'
import { isConfig } from '../utils'

export const resolveChainApi = <TApi>(
  config: TBuilderOptions<TApiOrUrl<TApi>> | undefined,
  chain: TSubstrateChain,
  createApiInstance: (wsUrl: TUrl) => Promise<TApi>
): Promise<TApi> => {
  const apiConfig = isConfig(config) ? config.apiOverrides?.[chain] : config

  if (isConfig(config) && config.development && !apiConfig) {
    throw new MissingChainApiError(chain)
  }

  if (!apiConfig) {
    return createApiInstance(getChainProviders(chain))
  }

  if (typeof apiConfig === 'string' || apiConfig instanceof Array) {
    return createApiInstance(apiConfig)
  }

  return Promise.resolve(apiConfig)
}
