import type { TAssetInfo, TChainAssetsInfo } from '../src'
import { assetRegistryFor } from '@snowbridge/registry'
import { DEFAULT_SS58_PREFIX } from './consts'
import { Parents } from '@paraspell/sdk-common'

type SnowbridgeNetwork = Parameters<typeof assetRegistryFor>[0]

const GC_JUNCTION = (chainId: number) => ({
  GlobalConsensus: { Ethereum: { chainId } }
})

const ED_ETH = '15000000000000'
const DEFAULT_ED = '1'

export const fetchEthereumAssetsForNetwork = async (
  network: SnowbridgeNetwork
): Promise<TAssetInfo[]> => {
  const registry = assetRegistryFor(network)

  const ethereumChainId = registry.ethChainId
  const snowbridgeAssets = registry.ethereumChains[ethereumChainId].assets

  return Object.values(snowbridgeAssets).map(asset => ({
    symbol: asset.symbol,
    assetId: asset.token,
    decimals: asset.decimals,
    existentialDeposit: ['WETH', 'ETH'].includes(asset.symbol) ? ED_ETH : DEFAULT_ED,
    location: {
      parents: Parents.TWO,
      interior:
        asset.symbol === 'ETH'
          ? {
              X1: [GC_JUNCTION(ethereumChainId)]
            }
          : {
              X2: [
                GC_JUNCTION(ethereumChainId),
                { AccountKey20: { network: null, key: asset.token } }
              ]
            }
    }
  }))
}

export const fetchEthereumAssets = async (
  networks: SnowbridgeNetwork[]
): Promise<TChainAssetsInfo> => {
  const assets = (
    await Promise.all(networks.map(network => fetchEthereumAssetsForNetwork(network)))
  ).flat()

  const seenAssetIds = new Set<string>()
  const dedupedAssets = assets.filter(asset => {
    if (!asset.assetId) return true
    if (seenAssetIds.has(asset.assetId)) return false
    seenAssetIds.add(asset.assetId)
    return true
  })

  return {
    isEVM: true,
    ss58Prefix: DEFAULT_SS58_PREFIX,
    supportsDryRunApi: false,
    supportsXcmPaymentApi: false,
    relaychainSymbol: 'ETH',
    nativeAssetSymbol: 'ETH',
    assets: dedupedAssets
  }
}
