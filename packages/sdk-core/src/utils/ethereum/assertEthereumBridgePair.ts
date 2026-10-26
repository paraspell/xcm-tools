import {
  ethereumBridgeDestinations,
  isEthereumBridgeOrigin,
  isExternalChain,
  type TChain,
  type TExternalChain
} from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'

/**
 * Rejects an Ethereum → Polkadot pair that is not in the per-network bridge map.
 * Mainnet origins cannot target Westend, Paseo, or Kusama, and testnet origins
 * cannot target Polkadot. ParaIds collide across those ecosystems, so the check
 * has to happen before a destination is reduced to a paraId.
 */
export const assertEthereumBridgePair: <TCustomChain extends string = never>(
  from: TChain | TCustomChain,
  to: TChain | TCustomChain
) => asserts from is TExternalChain = (from, to) => {
  if (!isExternalChain(from)) {
    throw new ScenarioNotSupportedError(
      'Snowbridge transfers are only supported from Ethereum or EthereumTestnet.'
    )
  }

  if (!isEthereumBridgeOrigin(to, from)) {
    const supported = ethereumBridgeDestinations(from).join(', ')
    throw new ScenarioNotSupportedError(
      `Transfers from ${from} to ${to} are not supported. Supported destinations: ${supported}.`
    )
  }
}
