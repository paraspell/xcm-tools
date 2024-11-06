/**
 * Error thrown when multiple assets with the same symbol are found.
 */
export class DuplicateAssetError extends Error {
  /**
   * Constructs a new DuplicateAssetError.
   *
   * @param symbol - The symbol of the asset causing the duplication error.
   */
  constructor(msg: string) {
    super(msg)
    this.name = 'DuplicateAsset'
  }
}
