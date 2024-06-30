import { ethers } from 'ethers'
import { NodeNotSupportedError } from '../errors'
import { createCurrencySpec } from '../pallets/xcmPallet/utils'
import {
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type XTransferTransferInput,
  Parents,
  type TNode
} from '../types'
import { createAccID } from '../utils'
import { type TJunction, type TMultiLocation } from '../types/TMultiLocation'

const determineDestWeight = (destNode?: TNode): { refTime: string; proofSize: string } | never => {
  if (destNode === 'Astar') {
    return { refTime: '6000000000', proofSize: '1000000' }
  }

  if (destNode === 'Moonbeam' || destNode === 'Hydration') {
    return { refTime: '5000000000', proofSize: '0' }
  }

  throw new NodeNotSupportedError(`Node ${destNode} is not supported`)
}

const getDestination = ({
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

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class XTransferTransferImpl {
  static transferXTransfer(input: XTransferTransferInput): Extrinsic | TSerializedApiCall {
    const {
      api,
      amount,
      origin,
      destination,
      serializedApiCallEnabled,
      overridedCurrencyMultiLocation
    } = input

    const isMultiLocationDestination = typeof destination === 'object'
    if (isMultiLocationDestination) {
      throw new Error(
        'Multilocation destinations are not supported for specific transfer you are trying to create. In special cases such as xTokens or xTransfer pallet try using address multilocation instead (for both destination and address in same multilocation set (eg. X2 - Parachain, Address). For further assistance please open issue in our repository.'
      )
    }

    const currencySpec = Object.values(
      createCurrencySpec(amount, Version.V1, Parents.ZERO, overridedCurrencyMultiLocation)
    )[0][0]

    const dest = getDestination(input)

    if (serializedApiCallEnabled === true) {
      return {
        module: 'xTransfer',
        section: 'transfer',
        parameters: [
          currencySpec,
          dest,
          origin === 'Khala' ? null : determineDestWeight(destination)
        ]
      }
    }
    return api.tx.xTransfer.transfer(
      currencySpec,
      dest,
      origin === 'Khala' ? null : determineDestWeight(destination)
    )
  }
}

export default XTransferTransferImpl
