import { ethers } from 'ethers'
import type { TAddress, TDestination } from '../../types'
import { isNodeEvm } from '../assets'
import { InvalidAddressError } from '../../errors'
import { isTMultiLocation } from './utils'

export const validateDestinationAddress = (
  address: TAddress,
  destination: TDestination | undefined
) => {
  if (typeof address === 'string' && destination && !isTMultiLocation(destination)) {
    const isDestinationEvm = isNodeEvm(destination)

    const isEthereumAddress = ethers.isAddress(address)

    if (isDestinationEvm) {
      if (!isEthereumAddress) {
        throw new InvalidAddressError(
          'Destination node is an EVM chain, but the address provided is not a valid Ethereum address.'
        )
      }
    } else {
      if (isEthereumAddress) {
        throw new InvalidAddressError('EVM address provided but destination is not an EVM chain.')
      }
    }
  }
}
