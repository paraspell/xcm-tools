import type { TAssetsQuery } from '../../types';

export const getApiEndpoint = (func: TAssetsQuery, node: string): string => {
  const endpoints: Record<TAssetsQuery, string> = {
    ASSETS_OBJECT: `/assets/${node}`,
    ASSET_ID: `/assets/${node}/id`,
    ASSET_MULTILOCATION: `/assets/${node}/multilocation`,
    RELAYCHAIN_SYMBOL: `/assets/${node}/relay-chain-symbol`,
    NATIVE_ASSETS: `/assets/${node}/native`,
    OTHER_ASSETS: `/assets/${node}/other`,
    FEE_ASSETS: `/assets/${node}/fee-assets`,
    ALL_SYMBOLS: `/assets/${node}/all-symbols`,
    DECIMALS: `/assets/${node}/decimals`,
    HAS_SUPPORT: `/assets/${node}/has-support`,
    PARA_ID: `/nodes/${node}/para-id`,
    CONVERT_SS58: `/convert-ss58`,
    ASSET_BALANCE: `/balance/${node}/asset`,
    EXISTENTIAL_DEPOSIT: `/balance/${node}/existential-deposit`,
    HAS_DRY_RUN_SUPPORT: `/nodes/${node}/has-dry-run-support`,
    ETHEREUM_BRIDGE_STATUS: `/x-transfer/eth-bridge-status`,
    PARA_ETH_FEES: `/x-transfer/para-eth-fees`,
  };

  return endpoints[func] ?? '/';
};
