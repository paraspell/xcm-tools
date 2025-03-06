import configs from '../../maps/configs.json' with { type: 'json' }
import type { TNodeConfig, TNodeConfigMap, TNodeDotKsmWithRelayChains } from '../../types'

const configsMap = configs as TNodeConfigMap

export const getNodeConfig = (node: TNodeDotKsmWithRelayChains): TNodeConfig => {
  return configsMap[node]
}
