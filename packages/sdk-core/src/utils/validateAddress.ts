import { isNodeEvm } from '@paraspell/assets'
import { isTLocation, type TNodeWithRelayChains } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import { InvalidAddressError } from '../errors'
import type { TAddress } from '../types'

export const validateAddress = (
  address: TAddress,
  node: TNodeWithRelayChains,
  isDestination = true
) => {
  if (isTLocation(address)) return

  const isEvm = isNodeEvm(node)

  const isEthereumAddress = isAddress(address)

  if (isEvm) {
    if (!isEthereumAddress) {
      throw new InvalidAddressError(
        `${isDestination ? 'Destination node' : 'Node'} is an EVM chain, but the address provided is not a valid Ethereum address.`
      )
    }
  } else {
    if (isEthereumAddress) {
      throw new InvalidAddressError(
        `EVM address provided but ${isDestination ? 'destination ' : ''}node is not an EVM chain.`
      )
    }
  }
}
