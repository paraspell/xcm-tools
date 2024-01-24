// Contains basic structure of xToken call

import {
  Version,
  type Extrinsic,
  type TPallet,
  type TSerializedApiCall,
  type XTokensTransferInput,
  Parents
} from '../types'
import { lowercaseFirstLetter } from '../utils'

const getModifiedCurrencySelection = (
  amount: string,
  currencyId?: string,
  paraIdTo?: number
): any => {
  return {
    [Version.V3]: {
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

    const modifiedCurrencySelection = isAssetHub
      ? getModifiedCurrencySelection(amount, currencyID, paraIdTo)
      : currencySelection

    const section = isAssetHub ? 'transferMultiasset' : 'transfer'

    if (serializedApiCallEnabled === true) {
      return {
        module,
        section,
        parameters: [modifiedCurrencySelection, addressSelection, fees]
      }
    }

    return api.tx[module][section](modifiedCurrencySelection, addressSelection, fees)
  }
}

export default XTokensTransferImpl
