import type { TApiType, TAssetsQuery } from '../../types';

export const getApiEndpoint = (
  func: TAssetsQuery,
  node: string,
  apiType: TApiType,
): string => {
  const papiSuffix = apiType === 'PAPI' ? '-papi' : '';

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
    BALANCE_NATIVE: `/balance/${node}/native${papiSuffix}`,
    BALANCE_FOREIGN: `/balance/${node}/foreign${papiSuffix}`,
    ASSET_BALANCE: `/balance/${node}/asset${papiSuffix}`,
    MAX_NATIVE_TRANSFERABLE_AMOUNT: `/balance/${node}/max-native-transferable-amount${papiSuffix}`,
    MAX_FOREIGN_TRANSFERABLE_AMOUNT: `/balance/${node}/max-foreign-transferable-amount${papiSuffix}`,
    TRANSFERABLE_AMOUNT: `/balance/${node}/transferable-amount${papiSuffix}`,
    EXISTENTIAL_DEPOSIT: `/balance/${node}/existential-deposit`,
    ORIGIN_FEE_DETAILS: `/origin-fee-details`,
    VERIFY_ED_ON_DESTINATION: `/balance/${node}/verify-ed-on-destination`,
  };

  return endpoints[func] ?? '/';
};
