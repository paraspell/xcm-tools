import {
  TEcosystemType,
  TNodeDotKsmWithRelayChains,
  TRelayChainSymbol
} from '@paraspell/sdk-common'
import { getNode } from '../../sdk-core/src'

export const getChainEcosystem = (node: TNodeDotKsmWithRelayChains): TEcosystemType => {
  if (node === 'Polkadot') return 'polkadot'
  if (node === 'Kusama') return 'kusama'
  if (node === 'Westend') return 'westend'
  if (node === 'Paseo') return 'paseo'
  return getNode(node).type
}

export const getRelayChainSymbolOf = (node: TNodeDotKsmWithRelayChains): TRelayChainSymbol => {
  if (node === 'Polkadot') return 'DOT'
  if (node === 'Kusama') return 'KSM'
  if (node === 'Westend') return 'WND'
  if (node === 'Paseo') return 'PAS'

  const ecosystem = getNode(node).type

  switch (ecosystem) {
    case 'polkadot':
      return 'DOT'
    case 'kusama':
      return 'KSM'
    case 'westend':
      return 'WND'
    case 'paseo':
      return 'PAS'
    default:
      throw new Error(`Unsupported ecosystem type for node: ${node}`)
  }
}
