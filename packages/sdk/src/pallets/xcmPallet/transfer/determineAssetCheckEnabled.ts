import type { TCurrencyInput, TNodePolkadotKusama } from '../../../types'
import { getNode } from '../../../utils'
import { isOverrideMultiLocationSpecifier } from '../../../utils/multiLocation/isOverrideMultiLocationSpecifier'

export const determineAssetCheckEnabled = <TApi, TRes>(
  origin: TNodePolkadotKusama,
  currency: TCurrencyInput,
  isBridge: boolean
): boolean => {
  const originNode = getNode<TApi, TRes, typeof origin>(origin)
  return 'multiasset' in currency ||
    ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) ||
    isBridge
    ? false
    : originNode.assetCheckEnabled
}
