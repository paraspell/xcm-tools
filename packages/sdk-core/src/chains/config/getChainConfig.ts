import type { TChainDotKsmWithRelayChains } from '@paraspell/sdk-common'

import configs from '../../maps/configs.json' with { type: 'json' }
import type { TChainConfig, TChainConfigMap } from '../../types'

const configsMap = configs as TChainConfigMap

export const getChainConfig = (chain: TChainDotKsmWithRelayChains): TChainConfig => {
  return configsMap[chain]
}
