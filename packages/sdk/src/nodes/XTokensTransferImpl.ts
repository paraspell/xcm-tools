/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Contains basic structure of xToken call

import {
  type Version,
  type Extrinsic,
  type TPallet,
  type TSerializedApiCall,
  type XTokensTransferInput,
  Parents,
  type TCurrencySelectionHeader,
  type TCurrency
} from '../types'
import { getNode, lowercaseFirstLetter } from '../utils'

const getModifiedCurrencySelection = (
  version: Version,
  amount: string,
  currencyId?: string,
  paraIdTo?: number
): TCurrencySelectionHeader => {
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

const getCurrencySelection = (
  { origin, amount, currencyID, paraIdTo, overridedCurrencyMultiLocation }: XTokensTransferInput,
  isAssetHub: boolean,
  currencySelection: any
): any => {
  const { version } = getNode(origin)

  if (overridedCurrencyMultiLocation !== undefined)
    return { [version]: overridedCurrencyMultiLocation }

  if (isAssetHub) {
    return getModifiedCurrencySelection(version, amount, currencyID, paraIdTo)
  }

  return currencySelection
}

const getParameters = (
  isAssetHub: boolean,
  currencySelection: any,
  addressSelection: any,
  amount: string,
  fees: string | number,
  feeAsset?: TCurrency
): any[] => {
  if (isAssetHub) {
    return feeAsset !== undefined
      ? [currencySelection, feeAsset, addressSelection, fees]
      : [currencySelection, addressSelection, fees]
  }
  return [currencySelection, amount, addressSelection, fees]
}

class XTokensTransferImpl {
  static transferXTokens(
    input: XTokensTransferInput,
    currencySelection: any,
    fees: string | number = 'Unlimited',
    pallet: TPallet = 'XTokens'
  ): Extrinsic | TSerializedApiCall {
    const { api, amount, addressSelection, destination, feeAsset, serializedApiCallEnabled } = input

    const isMultiLocationDestination = typeof destination === 'object'
    if (isMultiLocationDestination) {
      throw new Error(
        'Multilocation destinations are not supported for specific transfer you are trying to create. In special cases such as xTokens or xTransfer pallet try using address multilocation instead (for both destination and address in same multilocation set (eg. X2 - Parachain, Address). For further assistance please open issue in our repository.'
      )
    }

    const module = lowercaseFirstLetter(pallet.toString())

    const isAssetHub = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'

    const modifiedCurrencySelection = getCurrencySelection(input, isAssetHub, currencySelection)

    const section = isAssetHub ? 'transferMultiasset' : 'transfer'

    const parameters = getParameters(
      isAssetHub,
      modifiedCurrencySelection,
      addressSelection,
      amount,
      fees,
      feeAsset
    )

    if (serializedApiCallEnabled === true) {
      return {
        module,
        section,
        parameters
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return api.tx[module][section](...parameters)
  }
}

export default XTokensTransferImpl
