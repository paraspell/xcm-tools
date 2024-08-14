import { InvalidCurrencyError } from '../../../errors'
import { getOtherAssets } from '../../assets'

export const findEthAsset = (currency: string) => {
  const ethAssets = getOtherAssets('Ethereum')
  const ethAsset = ethAssets.find(asset => asset.symbol === currency)
  if (!ethAsset) {
    throw new InvalidCurrencyError(`Currency ${currency} is not supported for Ethereum transfers`)
  }
  return ethAsset
}
