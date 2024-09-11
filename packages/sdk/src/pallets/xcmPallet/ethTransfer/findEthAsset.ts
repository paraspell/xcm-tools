import { InvalidCurrencyError } from '../../../errors'
import { TCurrencyCore } from '../../../types'
import { getOtherAssets } from '../../assets'

export const findEthAsset = (currency: TCurrencyCore) => {
  const ethAssets = getOtherAssets('Ethereum')
  const ethAsset =
    'symbol' in currency
      ? ethAssets.find(asset => asset.symbol === currency.symbol)
      : ethAssets.find(asset => asset.assetId === currency.id)
  if (!ethAsset) {
    throw new InvalidCurrencyError(
      `Currency ${JSON.stringify(currency)} is not supported for Ethereum transfers`
    )
  }
  return ethAsset
}
