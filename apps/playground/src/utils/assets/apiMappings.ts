import type { TAssetsQuery } from '../../types';

export const getApiEndpoint = (func: TAssetsQuery, chain: string): string => {
  const endpoints: Record<TAssetsQuery, string> = {
    ASSETS_OBJECT: `/assets/${chain}`,
    ASSET_ID: `/assets/${chain}/id`,
    ASSET_LOCATION: `/assets/${chain}/location`,
    RELAYCHAIN_SYMBOL: `/assets/${chain}/relay-chain-symbol`,
    NATIVE_ASSETS: `/assets/${chain}/native`,
    OTHER_ASSETS: `/assets/${chain}/other`,
    SUPPORTED_ASSETS: `/supported-assets`,
    FEE_ASSETS: `/assets/${chain}/fee-assets`,
    ALL_SYMBOLS: `/assets/${chain}/all-symbols`,
    DECIMALS: `/assets/${chain}/decimals`,
    HAS_SUPPORT: `/assets/${chain}/has-support`,
    SUPPORTED_DESTINATIONS: `/supported-destinations`,
    PARA_ID: `/chains/${chain}/para-id`,
    CONVERT_SS58: `/convert-ss58`,
    ASSET_BALANCE: `/balance/${chain}/asset`,
    EXISTENTIAL_DEPOSIT: `/balance/${chain}/existential-deposit`,
    HAS_DRY_RUN_SUPPORT: `/chains/${chain}/has-dry-run-support`,
    ETHEREUM_BRIDGE_STATUS: `/x-transfer/eth-bridge-status`,
    PARA_ETH_FEES: `/x-transfer/para-eth-fees`,
  };

  return endpoints[func] ?? '/';
};
