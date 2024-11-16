import configs from '../../maps/configs.json' assert { type: 'json' }
import type { TNodeConfig, TNodeDotKsmWithRelayChains, TNodeConfigMap } from '../../types'

const configsMap = configs as TNodeConfigMap

export const getNodeConfig = (node: TNodeDotKsmWithRelayChains): TNodeConfig => {
  return configsMap[node]
}
