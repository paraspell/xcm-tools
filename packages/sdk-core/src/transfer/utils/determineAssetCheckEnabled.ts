import { isOverrideMultiLocationSpecifier, type TCurrencyInput } from '@paraspell/assets'
import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { getNode } from '../../utils'

export const determineAssetCheckEnabled = <TApi, TRes>(
  origin: TNodeDotKsmWithRelayChains,
  currency: TCurrencyInput
): boolean => {
  if (isRelayChain(origin)) return true
  const originNode = getNode<TApi, TRes, typeof origin>(origin)
  return 'multiasset' in currency ||
    ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation))
    ? false
    : originNode.assetCheckEnabled
}
