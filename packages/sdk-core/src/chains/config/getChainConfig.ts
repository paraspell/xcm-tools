import { isCustomChain, type TSubstrateChain } from '@paraspell/sdk-common'

import { CustomChainInvalidError } from '../../errors'
import configs from '../../maps/configs.json' with { type: 'json' }
import type { TChainConfig, TFullCustomCtx } from '../../types'
import { buildCustomChainConfig } from '../customChains'

export const getChainConfigImpl = <TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  ctx?: TFullCustomCtx
): TChainConfig => {
  if (isCustomChain(chain)) {
    const entry = ctx?.customChains?.[chain]
    if (!entry) {
      throw new CustomChainInvalidError(`Custom chain '${chain}' is not registered.`)
    }
    return buildCustomChainConfig(entry)
  }
  return configs[chain]
}

export const getChainConfig = (chain: TSubstrateChain): TChainConfig => getChainConfigImpl(chain)
