import { InvalidCurrencyError } from '../../errors'
import type {
  TCurrencySelectionHeader,
  TCurrencySelectionHeaderArr,
  TMultiAsset,
  Version,
  XTokensTransferInput
} from '../../types'
import { Parents } from '../../types'
import { isForeignAsset } from '../../utils/assets'

export const getModifiedCurrencySelection = <TApi, TRes>(
  version: Version,
  { paraIdTo, asset, amount, feeAsset }: XTokensTransferInput<TApi, TRes>
): TCurrencySelectionHeader | TCurrencySelectionHeaderArr => {
  if (!isForeignAsset(asset) || asset.assetId === '') {
    throw new InvalidCurrencyError('The selected asset has no currency ID')
  }

  const multiAsset: TMultiAsset = {
    id: {
      Concrete: {
        parents: Parents.ONE,
        interior: {
          X3: [
            { Parachain: paraIdTo },
            { PalletInstance: '50' },
            { GeneralIndex: BigInt(asset.assetId) }
          ]
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
