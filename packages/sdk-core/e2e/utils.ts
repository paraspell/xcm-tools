import { getSupportedAssets, type TAssetInfo } from '@paraspell/assets'
import {
  CHAINS,
  isExternalChain,
  isRelayChain,
  TChain,
  TSubstrateChain
} from '@paraspell/sdk-common'
import { getChain } from '../src'

const assetIdRequired: TChain[] = ['Peaq', 'Pendulum']

const isParaToRelayDisabled = (chain: TChain) => {
  if (!isExternalChain(chain)) {
    const chainInstance = getChain(chain)
    return chainInstance.isReceivingTempDisabled('ParaToRelay')
  }
  return false
}

const isSendingDisabled = (chain: TSubstrateChain, asset: TAssetInfo) =>
  !isRelayChain(chain) && getChain(chain).isSendingTempDisabled(asset)

export const generateTransferScenarios = (originChain: TSubstrateChain, includeAll = false) => {
  const scenarios = []

  const isAssetIdRequired = assetIdRequired.includes(originChain)

  for (const destChain of CHAINS) {
    if (destChain === originChain) continue
    if (isParaToRelayDisabled(destChain)) continue

    const assets = getSupportedAssets(originChain, destChain).filter(
      asset => !(isAssetIdRequired && asset.isNative) && !isSendingDisabled(originChain, asset)
    )

    for (const asset of includeAll ? assets : assets.slice(0, 1)) {
      scenarios.push({ originChain, destChain, asset })
    }
  }

  return scenarios
}
