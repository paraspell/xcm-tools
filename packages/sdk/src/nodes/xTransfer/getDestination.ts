import { ethers } from 'ethers'
import {
  Parents,
  type TJunction,
  type TMultiLocation,
  type XTransferTransferInput
} from '../../types'
import { createAccID } from '../../utils'

export const getDestination = ({
  recipientAddress,
  paraId,
  api
}: XTransferTransferInput): TMultiLocation => {
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
          id: createAccID(api, recipientAddress)
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
