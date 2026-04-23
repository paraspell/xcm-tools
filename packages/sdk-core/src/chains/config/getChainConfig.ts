import type { TSubstrateChain } from '@paraspell/sdk-common'

import configs from '../../maps/configs.json' with { type: 'json' }
import type { TChainConfig } from '../../types'

export const getChainConfig = (chain: TSubstrateChain): TChainConfig => {
  return configs[chain]
}
