import type { TAssetsQuery } from '../../types';

export const getApiEndpoint = (func: TAssetsQuery, node: string): string => {
  const endpoints: Record<TAssetsQuery, string> = {
    ASSETS_OBJECT: `/assets/${node}`,
    ASSET_ID: `/assets/${node}/id`,
    ASSET_MULTILOCATION: `/assets/${node}/multilocation`,
    RELAYCHAIN_SYMBOL: `/assets/${node}/relay-chain-symbol`,
    NATIVE_ASSETS: `/assets/${node}/native`,
    OTHER_ASSETS: `/assets/${node}/other`,
    ALL_SYMBOLS: `/assets/${node}/all-symbols`,
    DECIMALS: `/assets/${node}/decimals`,
    HAS_SUPPORT: `/assets/${node}/has-support`,
    PARA_ID: `/nodes/${node}/para-id`,
    BALANCE_NATIVE: `/balance/${node}/native`,
    BALANCE_FOREIGN: `/balance/${node}/foreign`,
    ASSET_BALANCE: `/balance/${node}/asset`,
    MAX_NATIVE_TRANSFERABLE_AMOUNT: `/balance/${node}/max-native-transferable-amount`,
    MAX_FOREIGN_TRANSFERABLE_AMOUNT: `/balance/${node}/max-foreign-transferable-amount`,
    TRANSFERABLE_AMOUNT: `/balance/${node}/transferable-amount`,
    EXISTENTIAL_DEPOSIT: `/balance/${node}/existential-deposit`,
    ORIGIN_FEE_DETAILS: `/origin-fee-details`,
    VERIFY_ED_ON_DESTINATION: `/balance/${node}/verify-ed-on-destination`,
    HAS_DRY_RUN_SUPPORT: `/nodes/${node}/has-dry-run-support`,
    ETHEREUM_BRIDGE_STATUS: `/x-transfer/eth-bridge-status`,
  };

  return endpoints[func] ?? '/';
};
