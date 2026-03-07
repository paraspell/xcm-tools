import {
  findAssetInfo,
  getAssets,
  getNativeAssetSymbol,
  getRelayChainSymbol,
  getOtherAssets
} from '@paraspell/assets'
import { hasJunction } from '@paraspell/sdk-common'
import { SUBSTRATE_CHAINS, TChain, TSubstrateChain } from '@paraspell/sdk-common'
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

  // ParaToPara scenarios
  for (const destChain of SUBSTRATE_CHAINS) {
    if (destChain === originChain) continue
    const chainInstance = getChain(destChain)
    if (chainInstance.isReceivingTempDisabled('RelayToPara')) continue
    if (getRelayChainSymbol(originChain) !== getRelayChainSymbol(destChain)) continue
    for (const asset of allAssets) {
      if (isNativeOnly && asset.symbol !== getNativeAssetSymbol(originChain)) continue
      if (isAssetIdRequired && asset.isNative) continue
      if (findAssetInfo(destChain, { location: asset.location }, null)) {
        scenarios.push({ originChain, destChain, asset })
        if (!includeAll) break
      }
    }
  }

  // Chain -> Ethereum scenarios
  const chainInstance = getChain(originChain)
  const supportsEthereum = typeof (chainInstance as any)?.transferToEthereum === 'function'
  if (supportsEthereum) {
    const ethAssets = getOtherAssets(originChain).filter(asset =>
      hasJunction(asset.location, 'GlobalConsensus', { Ethereum: { chainId: 1 } })
    )
    ethAssets.forEach(asset => {
      scenarios.push({ originChain, destChain: 'Ethereum', asset })
    })
  }

  return scenarios
}
