import type { TAddress, TMultiLocationHeader } from '../types'
import { Parents, Version } from '../types'
import { ethers } from 'ethers'
import type { IPolkadotApi } from '../api/IPolkadotApi'

export const generateAddressMultiLocationV4 = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: TAddress
): TMultiLocationHeader => {
  const isMultiLocation = typeof address === 'object'
  if (isMultiLocation) {
    return { [Version.V4]: address }
  }

  const isEthAddress = ethers.isAddress(address)
  return {
    [Version.V4]: {
      parents: Parents.ZERO,
      interior: {
        X1: [
          isEthAddress
            ? { AccountKey20: { key: address } }
            : { AccountId32: { id: api.accountToHex(address), network: null } }
        ]
      }
    }
  }
}
