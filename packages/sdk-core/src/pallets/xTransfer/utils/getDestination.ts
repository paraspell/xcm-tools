import { ethers } from 'ethers'
import {
  Parents,
  type TJunction,
  type TMultiLocation,
  type TXTransferTransferOptions
} from '../../../types'

export const getDestination = <TApi, TRes>({
  recipientAddress,
  paraId,
  api
}: TXTransferTransferOptions<TApi, TRes>): TMultiLocation => {
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
          id: api.accountToHex(recipientAddress)
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
