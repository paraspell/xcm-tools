/**
 * Error thrown when multiple assets with the same symbol are found.
 */
export class DuplicateAssetIdError extends Error {
  /**
   * Constructs a new DuplicateAssetError.
   *
   * @param symbol - The symbol of the asset causing the duplication error.
   */
  constructor(id: string) {
    super(
      `Multiple assets found with the same ID: ${id}. Please specify asset directly by symbol using .currency({symbol: <ASSET_SYMBOL>})`
    )
    this.name = 'DuplicateAssetId'
  }
}
