import { isCustomChain, type TSubstrateChain } from '@paraspell/sdk-common'

import { chains } from '../constants'
import { CustomChainInvalidError } from '../errors'
import type { TFullCustomCtx } from '../types'
import type Chain from './Chain'
import CustomChain from './CustomChain'

export const getChainImpl = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  ctx?: TFullCustomCtx
): Chain<TApi, TRes, TSigner> => {
  if (isCustomChain<TCustomChain>(chain)) {
    const entry = ctx?.customChains?.[chain]
    if (!entry) {
      throw new CustomChainInvalidError(`Custom chain '${chain}' is not registered.`)
    }
    return new CustomChain<TApi, TRes, TSigner>(entry.name, entry.ecosystem, entry.xcmVersion)
  }
  const map = chains<TApi, TRes, TSigner>()
  return map[chain]
}
