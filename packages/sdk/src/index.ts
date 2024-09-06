// Contains all important exports

export * as xcmPallet from './pallets/xcmPallet'
export * from './pallets/xcmPallet'
export * as assets from './pallets/assets'
export * from './pallets/assets'
export * from './pallets/pallets'
export * from './builder'
export * from './types'
export {
  NODE_NAMES_DOT_KSM,
  NODE_NAMES,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  SUPPORTED_PALLETS
} from './maps/consts'
export {
  getNodeEndpointOption,
  getNode,
  getNodeProvider,
  getAllNodeProviders,
  createApiInstanceForNode,
  isRelayChain
} from './utils'
export * from './errors'
export { getExistentialDeposit } from './pallets/xcmPallet/keepAlive'
