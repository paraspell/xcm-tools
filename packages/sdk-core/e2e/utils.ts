import {
  findAssetInfo,
  getAssets,
  getNativeAssetSymbol,
  getRelayChainSymbol,
  getOtherAssets
} from '@paraspell/assets'
import { hasJunction } from '@paraspell/sdk-common'
import { CHAINS, TChain, TSubstrateChain } from '@paraspell/sdk-common'
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

  for (const destChain of CHAINS) {
    if (destChain === 'Ethereum' || destChain === 'EthereumTestnet' || destChain === originChain) continue
    const chainInstance = getChain(destChain)
    if (chainInstance.isReceivingTempDisabled('RelayToPara')) continue
    if (getRelayChainSymbol(originChain) !== getRelayChainSymbol(destChain)) continue
    // Loop through assets to find the first compatible one
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
  function hasTransferToEthereum(obj: unknown): obj is { transferToEthereum: Function } {
    return !!obj && typeof (obj as any).transferToEthereum === 'function'
  }
  const chainInstance = getChain(originChain)
  const supportsEthereum = hasTransferToEthereum(chainInstance)
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
