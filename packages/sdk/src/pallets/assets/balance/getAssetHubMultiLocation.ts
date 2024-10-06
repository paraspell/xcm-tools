import type { TMultiLocation } from '../../../types'
import { getOtherAssets } from '../assets'

export const getAssetHubMultiLocation = (symbol?: string): TMultiLocation | null => {
  if (symbol === 'MYTH') {
    return {
      parents: 1,
      interior: {
        X1: {
          Parachain: '3369'
        }
      }
    }
  } else if (symbol === 'KSM') {
    return {
      parents: 2,
      interior: {
        X1: {
          GlobalConsensus: 'Kusama'
        }
      }
    }
  }
  const ethAssets = getOtherAssets('Ethereum')
  const ethAsset = ethAssets.find(asset => asset.symbol === symbol)
  if (ethAsset) {
    return {
      parents: 2,
      interior: {
        X2: [
          {
            GlobalConsensus: {
              Ethereum: {
                chainId: 1
              }
            }
          },
          {
            AccountKey20: {
              network: null,
              key: ethAsset.assetId
            }
          }
        ]
      }
    }
  }
  return null
}
