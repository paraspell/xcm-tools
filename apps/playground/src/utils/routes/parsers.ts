import type { TChain, TEvmChainFrom, TSubstrateChain } from '@paraspell/sdk';
import { CHAINS, SUBSTRATE_CHAINS } from '@paraspell/sdk';
import type { TExchangeChain } from '@paraspell/xcm-router';
import { EXCHANGE_CHAINS } from '@paraspell/xcm-router';
import { createParser } from 'nuqs';

import { ASSET_CLAIM_SUPPORTED_CHAINS } from '../../components/AssetClaim/AssetClaimForm';
import type {
  TCurrencyType,
  TCustomCurrencySymbolSpecifier,
} from '../../components/AssetsQueries/AssetsQueriesForm';
import { ASSET_QUERIES, PALLETS_QUERIES } from '../../consts';
import type { TAssetsQuery, TPalletsQuery } from '../../types';
import { isValidWalletAddress } from '../validationUtils';

function isValidSubstrateChain(value: string | null): value is TSubstrateChain {
  return value !== null && SUBSTRATE_CHAINS.includes(value as TSubstrateChain);
}

function isValidChain(value: string | null): value is TChain {
  return value !== null && CHAINS.includes(value as TChain);
}

function isValidEvmChain(value: string | null): value is TEvmChainFrom {
  return (
    value !== null &&
    ['Darwinia', 'Moonbeam', 'Moonriver', 'Ethereum'].includes(
      value as TEvmChainFrom,
    )
  );
}

function isValidAssetClaimChain(
  value: string | null,
): value is TSubstrateChain {
  return (
    value !== null &&
    ASSET_CLAIM_SUPPORTED_CHAINS.includes(value as TSubstrateChain)
  );
}

function isValidExchangeChain(value: string | null): value is TExchangeChain {
  return value !== null && EXCHANGE_CHAINS.includes(value as TExchangeChain);
}

function isValidAssetQuery(value: string | null): value is TAssetsQuery {
  return value !== null && ASSET_QUERIES.includes(value as TAssetsQuery);
}

function isValidPalletsQuery(value: string | null): value is TPalletsQuery {
  return value !== null && PALLETS_QUERIES.includes(value as TPalletsQuery);
}

export const parseAsSubstrateChain = createParser({
  parse(query) {
    return isValidSubstrateChain(query) ? query : null;
  },
  serialize(value) {
    return value;
  },
});

export const parseAsChain = createParser({
  parse(query) {
    return isValidChain(query) ? query : null;
  },
  serialize(value) {
    return value;
  },
});

export const parseAsEvmChain = createParser({
  parse(query) {
    return isValidEvmChain(query) ? query : null;
  },
  serialize(value) {
    return value;
  },
});

export const parseAsAssetClaimChain = createParser({
  parse(query) {
    return isValidAssetClaimChain(query) ? query : null;
  },
  serialize(value) {
    return value;
  },
});

export const parseAsExchangeChain = createParser({
  parse(query) {
    return isValidExchangeChain(query) ? query : null;
  },
  serialize(value) {
    return value;
  },
});

export const parseAsAssetQuery = createParser({
  parse(query) {
    return isValidAssetQuery(query) ? query : null;
  },
  serialize(value) {
    return value;
  },
});

export const parseAsPalletsQuery = createParser({
  parse(query) {
    return isValidPalletsQuery(query) ? query : null;
  },
  serialize(value) {
    return value;
  },
});

export const parseAsRecipientAddress = createParser({
  parse(query) {
    return query !== null && isValidWalletAddress(query) ? query : null;
  },
  serialize(value) {
    return value;
  },
});

export const parseAsCurrencyType = createParser({
  parse(query) {
    return query !== null && ['id', 'symbol', 'location'].includes(query)
      ? (query as TCurrencyType)
      : null;
  },
  serialize(value) {
    return value;
  },
});

export const parseAsCustomCurrencySymbolSpecifier = createParser({
  parse(query) {
    return query !== null &&
      ['auto', 'native', 'foreign', 'foreignAbstract'].includes(query)
      ? (query as TCustomCurrencySymbolSpecifier)
      : null;
  },
  serialize(value) {
    return value;
  },
});
