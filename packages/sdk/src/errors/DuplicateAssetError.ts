export class DuplicateAssetError extends Error {
  constructor(symbol: string) {
    super(
      `Multiple assets found with the same symbol: ${symbol}. Please specify asset ID directly by .currency({id: <ASSET_ID>})`
    )
    this.name = 'DuplicateAsset'
  }
}
