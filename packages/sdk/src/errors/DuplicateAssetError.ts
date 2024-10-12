/**
 * Error thrown when multiple assets with the same symbol are found.
 */
export class DuplicateAssetError extends Error {
  /**
   * Constructs a new DuplicateAssetError.
   *
   * @param symbol - The symbol of the asset causing the duplication error.
   */
  constructor(symbol: string) {
    super(
      `Multiple assets found with the same symbol: ${symbol}. Please specify asset ID directly by .currency({id: <ASSET_ID>})`
    )
    this.name = 'DuplicateAsset'
  }
}
