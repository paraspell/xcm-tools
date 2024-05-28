import { NODE_NAMES } from '../../src/maps/consts'
import { TAssetJsonMap } from '../../src/types'

const searchDecimalsBySymbol = (symbol: string, data: TAssetJsonMap) => {
  for (const node of NODE_NAMES) {
    if (node === 'BifrostPolkadot') {
      continue
    }
    const { nativeAssets, otherAssets } = data[node]
    const decimals = [...nativeAssets, ...otherAssets].find(
      asset => asset.symbol === symbol
    )?.decimals
    if (decimals) {
      return decimals
    }
  }
}

export const fillDecimalsBifrost = (data: TAssetJsonMap) => {
  data.BifrostPolkadot = {
    ...data.BifrostPolkadot,
    nativeAssets: data.BifrostPolkadot.nativeAssets.map(asset => {
      const decimals = asset.symbol === 'ASG' ? 18 : searchDecimalsBySymbol(asset.symbol, data)
      if (!decimals) {
        throw new Error(`Cannot find decimals for Bitfrost polkadot asset ${asset.symbol}`)
      }
      return {
        ...asset,
        decimals
      }
    })
  }
  return data
}
