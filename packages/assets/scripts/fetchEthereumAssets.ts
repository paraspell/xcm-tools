import type { TForeignAssetInfo, TChainAssetsInfo } from '../src'
import { assetRegistryFor } from '@snowbridge/registry'
import { DEFAULT_SS58_PREFIX } from './consts'
import { Parents } from '@paraspell/sdk-common'

const ED_ETH = '15000000000000'
const DEFAULT_ED = '1'

export const fetchEthereumAssets = async (): Promise<TChainAssetsInfo> => {
  const registry = assetRegistryFor('polkadot_mainnet')
  const ethereumChainId = registry.ethChainId
  const snowbridgeAssets = registry.ethereumChains[ethereumChainId].assets

  const assets: TForeignAssetInfo[] = Object.values(snowbridgeAssets).map(asset => ({
    symbol: asset.symbol,
    assetId: asset.token,
    decimals: asset.decimals,
    existentialDeposit: ['WETH', 'ETH'].includes(asset.symbol) ? ED_ETH : DEFAULT_ED,
    location: {
      parents: Parents.TWO,
      interior: {
        X2: [
          {
            GlobalConsensus: { Ethereum: { chainId: 1 } }
          },
          { AccountKey20: { network: null, key: asset.token } }
        ]
      }
    }
  }))

  return {
    isEVM: true,
    ss58Prefix: DEFAULT_SS58_PREFIX,
    supportsDryRunApi: false,
    supportsXcmPaymentApi: false,
    relaychainSymbol: 'DOT',
    nativeAssetSymbol: 'ETH',
    nativeAssets: [],
    otherAssets: assets
  }
}
