import {
  getAssets,
  getNativeAssetSymbol,
  getRelayChainSymbol,
  hasSupportForAsset
} from '@paraspell/assets'
import { isRelayChain, SUBSTRATE_CHAINS, TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { getChain } from '../src'

const supportsOnlyNativeAsset: TChain[] = ['Nodle']

const assetIdRequired: TChain[] = ['Manta', 'Peaq', 'Pendulum']

export const doesNotSupportParaToRelay: TChain[] = [
  'Peaq',
  'Ajuna',
  'AjunaPaseo',
  'EnergyWebX',
  'EnergyWebXPaseo'
]

export const generateTransferScenarios = (originChain: TSubstrateChain, includeAll = false) => {
  const scenarios = []
  const allAssets = getAssets(originChain)

  const isNativeOnly = supportsOnlyNativeAsset.includes(originChain)
  const isAssetIdRequired = assetIdRequired.includes(originChain)

  for (const destChain of SUBSTRATE_CHAINS) {
    if (destChain === originChain) continue
    const chainInstance = !isRelayChain(destChain) ? getChain(destChain) : null
    if (chainInstance?.isReceivingTempDisabled('RelayToPara')) continue
    if (getRelayChainSymbol(originChain) !== getRelayChainSymbol(destChain)) continue

    // Loop through assets to find the first compatible one
    for (const asset of allAssets) {
      if (isNativeOnly && asset.symbol !== getNativeAssetSymbol(originChain)) continue
      if (isAssetIdRequired && asset.isNative) continue

      const notCompatible =
        ['DOT', 'KSM'].includes(asset.symbol) &&
        (destChain === 'AssetHubPolkadot' || destChain === 'AssetHubKusama')

      if (hasSupportForAsset(destChain, asset.symbol) && !notCompatible) {
        scenarios.push({ originChain, destChain, asset })

        if (!includeAll) break
      }
    }
  }

  return scenarios
}
