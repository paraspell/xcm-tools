import {
  TEcosystemType,
  TNodeDotKsmWithRelayChains,
  TRelayChainSymbol
} from '@paraspell/sdk-common'
import { getNode } from '../../sdk-core/src'

export const getRelayChainType = (node: TNodeDotKsmWithRelayChains): TEcosystemType => {
  if (node === 'Polkadot') return 'polkadot'
  if (node === 'Kusama') return 'kusama'
  return getNode(node).type
}

export const getRelayChainSymbol = (node: TNodeDotKsmWithRelayChains): TRelayChainSymbol => {
  if (node === 'Polkadot') return 'DOT'
  if (node === 'Kusama') return 'KSM'
  return getNode(node).type === 'polkadot' ? 'DOT' : 'KSM'
}
