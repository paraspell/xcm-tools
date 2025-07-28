import { isOverrideLocationSpecifier, type TCurrencyInput } from '@paraspell/assets'
import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

export const shouldPerformAssetCheck = (
  origin: TNodeDotKsmWithRelayChains,
  currency: TCurrencyInput
): boolean => {
  if (isRelayChain(origin)) return true

  const hasMultiAsset = 'multiasset' in currency
  const hasOverriddenLocation =
    'location' in currency && isOverrideLocationSpecifier(currency.location)

  return !(hasMultiAsset || hasOverriddenLocation)
}
