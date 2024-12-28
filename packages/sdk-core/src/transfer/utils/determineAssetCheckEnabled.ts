import type { TCurrencyInput, TNodeDotKsmWithRelayChains } from '../../types'
import { getNode, isRelayChain } from '../../utils'
import { isOverrideMultiLocationSpecifier } from '../../utils/multiLocation/isOverrideMultiLocationSpecifier'

export const determineAssetCheckEnabled = <TApi, TRes>(
  origin: TNodeDotKsmWithRelayChains,
  currency: TCurrencyInput,
  isBridge: boolean
): boolean => {
  if (isRelayChain(origin)) return true
  const originNode = getNode<TApi, TRes, typeof origin>(origin)
  return 'multiasset' in currency ||
    ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) ||
    isBridge
    ? false
    : originNode.assetCheckEnabled
}
