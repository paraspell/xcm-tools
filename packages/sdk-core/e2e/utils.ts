import {
  findAssetInfo,
  getAssets,
  getNativeAssetSymbol,
  getRelayChainSymbol
} from '@paraspell/assets'
import {
  CHAINS,
  isExternalChain,
  SUBSTRATE_CHAINS,
  TChain,
  TSubstrateChain
} from '@paraspell/sdk-common'
import { getChain } from '../src'

const assetIdRequired: TChain[] = ['Manta', 'Peaq', 'Pendulum']

export const doesNotSupportParaToRelay: TChain[] = [
  'Peaq',
  'Ajuna',
  'AjunaPaseo',
  'EnergyWebX',
  'EnergyWebXPaseo'
]

const isParaToRelayDisabled = (chain: TChain) => {
  if (!isExternalChain(chain)) {
    const chainInstance = getChain(chain)
    return chainInstance.isReceivingTempDisabled('ParaToRelay')
  }
  return false
}

export const generateTransferScenarios = (originChain: TSubstrateChain, includeAll = false) => {
  const scenarios = []
  const allAssets = getAssets(originChain)

  const isAssetIdRequired = assetIdRequired.includes(originChain)

  for (const destChain of CHAINS) {
    if (isParaToRelayDisabled(destChain)) continue
    if (getRelayChainSymbol(originChain) !== getRelayChainSymbol(destChain)) continue

    // Loop through assets to find the first compatible one
    for (const asset of allAssets) {
      if (isAssetIdRequired && asset.isNative) continue

      if (findAssetInfo(destChain, { location: asset.location })) {
        scenarios.push({ originChain, destChain, asset })
        if (!includeAll) break
      }
    }
  }

  return scenarios
}
