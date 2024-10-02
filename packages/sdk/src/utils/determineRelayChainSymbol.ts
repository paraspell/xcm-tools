import { getRelayChainSymbol } from '../pallets/assets'
import { TNodeWithRelayChains } from '../types'

export const determineRelayChainSymbol = (node: TNodeWithRelayChains): string => {
  if (node === 'Polkadot') {
    return 'DOT'
  } else if (node === 'Kusama') {
    return 'KSM'
  } else {
    return getRelayChainSymbol(node)
  }
}
