// Contains basic structure of xToken call

import {
  type Version,
  type Extrinsic,
  type TPallet,
  type TSerializedApiCall,
  type XTokensTransferInput,
  Parents
} from '../types'
import { getNode, lowercaseFirstLetter } from '../utils'

const getModifiedCurrencySelection = (
  version: Version,
  amount: string,
  currencyId?: string,
  paraIdTo?: number
): any => {
  return {
    [version]: {
      id: {
        Concrete: {
          parents: Parents.ONE,
          interior: {
            X3: [{ Parachain: paraIdTo }, { PalletInstance: '50' }, { GeneralIndex: currencyId }]
          }
        }
      },
      fun: {
        Fungible: amount
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class XTokensTransferImpl {
  static transferXTokens(
    {
      api,
      amount,
      currencyID,
      addressSelection,
      origin,
      destination,
      paraIdTo,
      serializedApiCallEnabled
    }: XTokensTransferInput,
    currencySelection: any,
    fees: string | number = 'Unlimited',
    pallet: TPallet = 'XTokens'
  ): Extrinsic | TSerializedApiCall {
    const module = lowercaseFirstLetter(pallet.toString())

    const isAssetHub = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'

    const node = getNode(origin)

    const modifiedCurrencySelection = isAssetHub
      ? getModifiedCurrencySelection(node.version, amount, currencyID, paraIdTo)
      : currencySelection

    const section = isAssetHub ? 'transferMultiasset' : 'transfer'

    if (serializedApiCallEnabled === true) {
      return {
        module,
        section,
        parameters: isAssetHub
          ? [modifiedCurrencySelection, addressSelection, fees]
          : [currencySelection, amount, addressSelection, fees]
      }
    }

    return isAssetHub
      ? api.tx[module][section](modifiedCurrencySelection, addressSelection, fees)
      : api.tx[module][section](currencySelection, amount, addressSelection, fees)
  }
}

export default XTokensTransferImpl
