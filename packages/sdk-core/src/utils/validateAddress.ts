import { isChainEvm } from '@paraspell/assets'
import { isTLocation, type TChain } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import type { IPolkadotApi } from '../api'
import { InvalidAddressError } from '../errors'
import type { TAddress } from '../types'

export const validateAddress = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: TAddress,
  chain: TChain,
  isDestination = true
) => {
  if (isTLocation(address)) return

  const isEvm = isChainEvm(chain)
  const isEthereumAddress = isAddress(address)

  const isPublicKeyFormat =
    typeof address === 'string' && address.startsWith('0x') && !isEthereumAddress

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

    if (isPublicKeyFormat) {
      return
    }

    if (typeof address === 'string') {
      const isValid = api.validateSubstrateAddress(address)
      if (!isValid) {
        throw new InvalidAddressError(`Invalid address: ${address}`)
      }
    }
  }
}
