import { SUBSTRATE_CHAINS, TSubstrateChain } from '@paraspell/sdk-common'

import { fetchPalletList } from '../../sdk/src/utils/fetchPalletList'
import { createScriptProgress } from '../../sdk-common/scripts/progress'
import {
  CHAIN_TIMEOUT_MS,
  fetchFromChain,
  filterRequestedChains,
  handleDataFetching
} from '../../sdk-common/scripts/scriptUtils'
import type {
  TPallet,
  TPalletMap,
  TPalletJsonMap,
  TPalletDetails,
  TAssetsPallet,
  TPalletEntry
} from '../src'
import { NATIVE_ASSETS_PALLET_PRIORITY, OTHER_ASSETS_PALLET_PRIORITY } from '../src'

const JSON_FILE_PATH = './src/maps/pallets.json'

const defaultPalletsByPriority: TPallet[] = ['XcmPallet', 'XTokens', 'PolkadotXcm']

const composePalletMapObject = (pallets: TPalletEntry[], chain: TSubstrateChain): TPalletMap => {
  const toDetails = (p: TPalletEntry): TPalletDetails => ({
    name: p.name as TPallet,
    index: p.index
  })
  const palletDetails = pallets.filter(p => p.hasExtrinsics).map(toDetails)
  const palletDetailsWithoutExtrinsics = pallets.filter(p => !p.hasExtrinsics).map(toDetails)

  const allPallets = [
    ...defaultPalletsByPriority,
    ...NATIVE_ASSETS_PALLET_PRIORITY,
    ...OTHER_ASSETS_PALLET_PRIORITY
  ] as readonly string[]

  const supportedPallets = palletDetails.filter(pallet => allPallets.includes(pallet.name))

  const defaultPallet = defaultPalletsByPriority.find(pallet =>
    supportedPallets.map(item => item.name).includes(pallet)
  ) as TPallet

  const nativeAssetsPallet = NATIVE_ASSETS_PALLET_PRIORITY.find(pallet =>
    palletDetails.map(item => item.name).includes(pallet)
  ) as TAssetsPallet

  const otherAssetsPallets = chain.startsWith('Moon')
    ? (['System'] as TAssetsPallet[])
    : (OTHER_ASSETS_PALLET_PRIORITY.filter(pallet =>
        palletDetails.map(item => item.name).includes(pallet)
      ) as TAssetsPallet[])

  const additionalOtherPallets = OTHER_ASSETS_PALLET_PRIORITY.filter(pallet =>
    palletDetailsWithoutExtrinsics.map(item => item.name).includes(pallet)
  ) as TAssetsPallet[]

  return {
    defaultPallet,
    supportedPallets,
    nativeAssets: nativeAssetsPallet,
    otherAssets: [...otherAssetsPallets, ...additionalOtherPallets]
  }
}

const fetchAllChainsPallets = async (assetsMapJson: unknown) => {
  const output = JSON.parse(JSON.stringify(assetsMapJson)) as TPalletJsonMap
  const chains = filterRequestedChains(SUBSTRATE_CHAINS, chain => chain)
  const progress = createScriptProgress(chains, 'Pallets', CHAIN_TIMEOUT_MS)
  for (const chain of chains) {
    progress.update(chain)

    const pallets = await fetchFromChain(chain, fetchPalletList)
    const newData = pallets ? composePalletMapObject(pallets, chain) : null

    const oldData = Object.prototype.hasOwnProperty.call(output, chain) ? output[chain] : null

    // If we don't have newData and also oldData continue to another chain
    if (!newData && !oldData) {
      continue
    }

    output[chain] = newData ?? (oldData as TPalletMap)
  }
  progress.stop()
  return output
}

void (async () => {
  await handleDataFetching(JSON_FILE_PATH, fetchAllChainsPallets, 'Successfuly updated pallets.')
})()
