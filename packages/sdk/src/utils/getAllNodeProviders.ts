import { TNodePolkadotKusama } from '../types'
import { getNodeEndpointOption } from '../utils'

export const getAllNodeProviders = (node: TNodePolkadotKusama): string[] => {
  const { providers } = getNodeEndpointOption(node) ?? {}
  if (providers && Object.values(providers).length < 1) {
    throw new Error(`Node ${node} does not have any providers.`)
  }
  return Object.values(providers ?? [])
}
