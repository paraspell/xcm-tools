import { isNodeEvm } from '@paraspell/assets'
import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { ethers } from 'ethers'

import { InvalidAddressError } from '../errors'
import type { TAddress } from '../types'

export const validateAddress = (
  address: TAddress,
  node: TNodeWithRelayChains,
  isDestination = true
) => {
  const isEvm = isNodeEvm(node)

  const isEthereumAddress = ethers.isAddress(address)

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
