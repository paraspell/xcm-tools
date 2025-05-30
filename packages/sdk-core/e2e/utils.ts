import {
  getAssets,
  getNativeAssetSymbol,
  getRelayChainSymbol,
  hasSupportForAsset,
  isForeignAsset
} from '@paraspell/assets'
import { NODE_NAMES_DOT_KSM, TNode } from '@paraspell/sdk-common'

const supportsOnlyNativeAsset: TNode[] = ['Nodle', 'Pendulum', 'Phala', 'Subsocial', 'Ajuna']

const assetIdRequired: TNode[] = [
  'Manta',
  'Unique',
  'Quartz',
  'Peaq',
  'Basilisk',
  'Amplitude',
  'Pendulum'
]

export const doesNotSupportParaToRelay: TNode[] = ['Phala', 'Peaq', 'Pendulum', 'Ajuna']

export const generateTransferScenarios = (originNode: TNode) => {
  const scenarios = []
  const allAssets = getAssets(originNode)

  const isNativeOnly = supportsOnlyNativeAsset.includes(originNode)
  const isAssetIdRequired = assetIdRequired.includes(originNode)

  for (const destNode of NODE_NAMES_DOT_KSM) {
    if (destNode === originNode) continue
    if (getRelayChainSymbol(originNode) !== getRelayChainSymbol(destNode)) continue

    // Loop through assets to find the first compatible one
    for (const asset of allAssets) {
      if (isNativeOnly && asset.symbol !== getNativeAssetSymbol(originNode)) continue
      if (isAssetIdRequired && !isForeignAsset(asset)) continue

      // Special case: Sending assets to Polimec is supported only from AssetHubPolkadot
      if (destNode === 'Polimec' && originNode !== 'AssetHubPolkadot') {
        continue
      }

      if (originNode === 'Polimec' && destNode === 'AssetHubPolkadot' && asset.symbol === 'PLMC') {
        continue
      }

      const notCompatible =
        ['DOT', 'KSM'].includes(asset.symbol) &&
        (destNode === 'AssetHubPolkadot' || destNode === 'AssetHubKusama')

      if (hasSupportForAsset(destNode, asset.symbol) && !notCompatible) {
        scenarios.push({ originNode, destNode, asset })

        break
      }
    }
  }

  return scenarios
}
