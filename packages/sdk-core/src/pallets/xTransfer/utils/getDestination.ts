import { Parents, type TJunction, type TMultiLocation } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import { type TXTransferTransferOptions } from '../../../types'

export const getDestination = <TApi, TRes>({
  recipientAddress,
  paraId,
  api
}: TXTransferTransferOptions<TApi, TRes>): TMultiLocation => {
  const isMultiLocation = typeof recipientAddress === 'object'
  if (isMultiLocation) {
    return recipientAddress
  }

  const isEthAddress = isAddress(recipientAddress)

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
