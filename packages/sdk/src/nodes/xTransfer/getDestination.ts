import { ethers } from 'ethers'
import {
  Parents,
  type TJunction,
  type TMultiLocation,
  type XTransferTransferInput
} from '../../types'

export const getDestination = <TApi, TRes>({
  recipientAddress,
  paraId,
  api
}: XTransferTransferInput<TApi, TRes>): TMultiLocation => {
  const isMultiLocation = typeof recipientAddress === 'object'
  if (isMultiLocation) {
    return recipientAddress
  }

  const isEthAddress = ethers.isAddress(recipientAddress)

  const addressJunction: TJunction = isEthAddress
    ? {
        AccountKey20: {
          key: recipientAddress
        }
      }
    : {
        AccountId32: {
          id: api.createAccountId(recipientAddress)
        }
      }

  return {
    parents: Parents.ONE,
    interior: {
      X2: [
        {
          Parachain: paraId
        },
        addressJunction
      ]
    }
  }
}
