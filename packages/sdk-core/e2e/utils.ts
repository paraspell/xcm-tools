import {
  getAssets,
  getNativeAssetSymbol,
  getRelayChainSymbol,
  hasSupportForAsset
} from '@paraspell/assets'
import { isRelayChain, SUBSTRATE_CHAINS, TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { getChain } from '../src'
import { resolveScenario } from '../src/utils/transfer/resolveScenario'

const supportsOnlyNativeAsset: TChain[] = ['Nodle', 'Pendulum', 'Phala', 'Ajuna', 'AjunaPaseo']

const assetIdRequired: TChain[] = [
  'Manta',
  'Unique',
  'Quartz',
  'Peaq',
  'Basilisk',
  'Amplitude',
  'Pendulum',
  'KiltPaseo'
]

export const doesNotSupportParaToRelay: TChain[] = [
  'Phala',
  'Peaq',
  'Pendulum',
  'Ajuna',
  'AjunaPaseo',
  'EnergyWebX',
  'EnergyWebXPaseo'
]

export const generateTransferScenarios = (originChain: TSubstrateChain, includeAllCompatibleAssets: boolean = false) => {
  const scenarios = []
  const allAssets = getAssets(originChain)

  const isNativeOnly = supportsOnlyNativeAsset.includes(originChain)
  const isAssetIdRequired = assetIdRequired.includes(originChain)

  for (const destChain of SUBSTRATE_CHAINS) {
    if (destChain === originChain) continue
    const chainInstance = !isRelayChain(destChain) ? getChain(destChain) : null
    const scenario = resolveScenario(originChain, destChain)
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

        if (!includeAllCompatibleAssets) break
      }
    }
  }

  return scenarios
}
