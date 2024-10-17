import { InvalidCurrencyError } from '../../errors'
import type {
  TCurrencySelectionHeader,
  TCurrencySelectionHeaderArr,
  TMultiAsset,
  Version,
  XTokensTransferInput
} from '../../types'
import { Parents } from '../../types'

export const getModifiedCurrencySelection = <TApi, TRes>(
  version: Version,
  { paraIdTo, currencyID, amount, feeAsset }: XTokensTransferInput<TApi, TRes>
): TCurrencySelectionHeader | TCurrencySelectionHeaderArr => {
  if (currencyID === undefined || currencyID === '') {
    throw new InvalidCurrencyError('The selected asset has no currency ID')
  }

  const multiAsset: TMultiAsset = {
    id: {
      Concrete: {
        parents: Parents.ONE,
        interior: {
          X3: [{ Parachain: paraIdTo }, { PalletInstance: '50' }, { GeneralIndex: currencyID }]
        }
      }
    },
    fun: {
      Fungible: amount
    }
  }

  return {
    [version]: feeAsset === undefined ? multiAsset : [multiAsset]
  }
}
