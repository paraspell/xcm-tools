import { isChainEvm } from '@paraspell/assets'
import { isTLocation, type TChain } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import { InvalidAddressError } from '../errors'
import type { TAddress } from '../types'

export const validateAddress = (address: TAddress, chain: TChain, isDestination = true) => {
  if (isTLocation(address)) return

  const isEvm = isChainEvm(chain)

  const isEthereumAddress = isAddress(address)

  if (isEvm) {
    if (!isEthereumAddress) {
      throw new InvalidAddressError(
        `${isDestination ? 'Destination chain' : 'Chain'} is an EVM chain, but the address provided is not a valid Ethereum address.`
      )
    }
  } else {
    if (isEthereumAddress) {
      throw new InvalidAddressError(
        `EVM address provided but ${isDestination ? 'destination ' : ''}chain is not an EVM chain.`
      )
    }
  }
}
