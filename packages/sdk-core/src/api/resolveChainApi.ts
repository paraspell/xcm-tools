import { isCustomChain, type TSubstrateChain } from '@paraspell/sdk-common'

import { getChainProvidersImpl } from '../chains/config'
import { MissingChainApiError } from '../errors'
import type { TApiOrUrl, TBuilderOptions, TFullCustomCtx, TUrl } from '../types'
import { isConfig } from '../utils'

export const resolveChainApi = <TApi, TCustomChain extends string = never>(
  config: TBuilderOptions<TApiOrUrl<TApi>> | undefined,
  chain: TSubstrateChain | TCustomChain,
  createApiInstance: (wsUrl: TUrl) => Promise<TApi>,
  ctx?: TFullCustomCtx
): Promise<TApi> => {
  const apiConfig = isConfig(config)
    ? isCustomChain(chain)
      ? undefined
      : config.apiOverrides?.[chain]
    : config

  if (isConfig(config) && config.development && !apiConfig) {
    throw new MissingChainApiError(chain)
  }

  if (!apiConfig) {
    return createApiInstance(getChainProvidersImpl(chain, ctx))
  }

  if (typeof apiConfig === 'string' || apiConfig instanceof Array) {
    return createApiInstance(apiConfig)
  }

  return Promise.resolve(apiConfig)
}
