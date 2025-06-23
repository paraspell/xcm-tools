import { extractMultiAssetLoc, type TMultiAsset } from '@paraspell/assets'

export const createAssetsFilter = (asset: TMultiAsset) => ({
  Wild: {
    AllOf: {
      id: extractMultiAssetLoc(asset),
      fun: 'Fungible'
    }
  }
})
