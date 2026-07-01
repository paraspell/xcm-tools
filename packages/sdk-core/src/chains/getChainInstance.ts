import {
  isCustomChain,
  isExternalChain,
  type TChain,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import { chains } from '../constants'
import { CustomChainInvalidError } from '../errors'
import type { TFullCustomCtx } from '../types'
import type Chain from './Chain'
import CustomChain from './CustomChain'
import type SubstrateChain from './SubstrateChain'

export const getSubstrateChainImpl = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  ctx?: TFullCustomCtx
): SubstrateChain<TApi, TRes, TSigner, TCustomChain> => {
  if (isCustomChain(chain)) {
    const entry = ctx?.customChains?.[chain]
    if (!entry) {
      throw new CustomChainInvalidError(`Custom chain '${chain}' is not registered.`)
    }
    return new CustomChain<TApi, TRes, TSigner, TCustomChain>(
      chain,
      entry.ecosystem,
      entry.xcmVersion
    )
  }
  return chains<TApi, TRes, TSigner>()[chain]
}

export const getChainImpl = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TFullCustomCtx
): Chain<TApi, TRes, TSigner, TCustomChain> => {
  if (!isExternalChain(chain)) {
    return getSubstrateChainImpl<TApi, TRes, TSigner, TCustomChain>(chain, ctx)
  }
  return chains<TApi, TRes, TSigner>()[chain]
}
