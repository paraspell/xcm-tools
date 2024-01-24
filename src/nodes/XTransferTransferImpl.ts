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

const determineDestWeight = (destNode?: TNode): { refTime: string; proofSize: string } | never => {
  if (destNode === 'Astar') {
    return { refTime: '6000000000', proofSize: '1000000' }
  }

  if (destNode === 'Moonbeam' || destNode === 'HydraDX') {
    return { refTime: '5000000000', proofSize: '0' }
  }

  throw new NodeNotSupportedError(`Node ${destNode} is not supported`)
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class XTransferTransferImpl {
  static transferXTransfer({
    api,
    amount,
    origin,
    recipientAddress,
    destination,
    paraId,
    serializedApiCallEnabled
  }: XTransferTransferInput): Extrinsic | TSerializedApiCall {
    const currencySpec = createCurrencySpec(amount, Version.V1, Parents.ZERO)[Version.V1][0]

    const isEthAddress = ethers.utils.isAddress(recipientAddress)
    const dest = {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: paraId
          },
          {
            [isEthAddress ? 'AccountKey20' : 'AccountId32']: {
              ...(isEthAddress
                ? { key: recipientAddress }
                : { id: createAccID(api, recipientAddress) })
            }
          }
        ]
      }
    }

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
