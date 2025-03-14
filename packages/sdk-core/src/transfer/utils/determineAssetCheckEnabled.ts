import { isOverrideMultiLocationSpecifier, type TCurrencyInput } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { getNode, isRelayChain } from '../../utils'

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
