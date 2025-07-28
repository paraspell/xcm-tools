import { extractAssetLocation, type TAsset } from '@paraspell/assets'

export const createAssetsFilter = (asset: TAsset) => ({
  Wild: {
    AllOf: {
      id: extractAssetLocation(asset),
      fun: 'Fungible'
    }
  }
})
