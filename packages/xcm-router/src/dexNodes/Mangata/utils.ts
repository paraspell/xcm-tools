import { type TokenInfo, type MangataInstance } from '@mangata-finance/sdk';

export const getAssetInfo = async (
  mangata: MangataInstance,
  symbol: string,
): Promise<TokenInfo | undefined> => {
  return await mangata.query
    .getAssetsInfo()
    .then((assets) => Object.values(assets).find((asset) => asset.symbol === symbol));
};
