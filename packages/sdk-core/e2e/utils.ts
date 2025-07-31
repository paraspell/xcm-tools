import {
  getAssets,
  getNativeAssetSymbol,
  getRelayChainSymbol,
  hasSupportForAsset,
  isForeignAsset
} from '@paraspell/assets'
import { CHAIN_NAMES_DOT_KSM, TChain } from '@paraspell/sdk-common'

const supportsOnlyNativeAsset: TChain[] = [
  'Nodle',
  'Pendulum',
  'Phala',
  'Subsocial',
  'Ajuna',
  'AjunaPaseo'
]

const assetIdRequired: TChain[] = [
  'Manta',
  'Unique',
  'Quartz',
  'Peaq',
  'Basilisk',
  'Amplitude',
  'Pendulum'
]

export const doesNotSupportParaToRelay: TChain[] = [
  'Phala',
  'Peaq',
  'Pendulum',
  'Ajuna',
  'AjunaPaseo'
]

export const generateTransferScenarios = (originChain: TChain) => {
  const scenarios = []
  const allAssets = getAssets(originChain)

  const isNativeOnly = supportsOnlyNativeAsset.includes(originChain)
  const isAssetIdRequired = assetIdRequired.includes(originChain)

  for (const destChain of CHAIN_NAMES_DOT_KSM) {
    if (destChain === originChain) continue
    if (getRelayChainSymbol(originChain) !== getRelayChainSymbol(destChain)) continue

    // Loop through assets to find the first compatible one
    for (const asset of allAssets) {
      if (isNativeOnly && asset.symbol !== getNativeAssetSymbol(originChain)) continue
      if (isAssetIdRequired && !isForeignAsset(asset)) continue

      // Special case: Sending assets to Polimec is supported only from AssetHubPolkadot
      if (destChain === 'Polimec' && originChain !== 'AssetHubPolkadot') {
        continue
      }

      if (
        originChain === 'Polimec' &&
        destChain === 'AssetHubPolkadot' &&
        asset.symbol === 'PLMC'
      ) {
        continue
      }

      const notCompatible =
        ['DOT', 'KSM'].includes(asset.symbol) &&
        (destChain === 'AssetHubPolkadot' || destChain === 'AssetHubKusama')

      if (hasSupportForAsset(destChain, asset.symbol) && !notCompatible) {
        scenarios.push({ originChain, destChain, asset })

        break
      }
    }
  }

  return scenarios
}
