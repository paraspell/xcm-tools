import type { TChain, TEvmChainFrom, TSubstrateChain } from '@paraspell/sdk';
import { CHAINS, SUBSTRATE_CHAINS } from '@paraspell/sdk';
import type { TExchangeChain } from '@paraspell/xcm-router';
import { EXCHANGE_CHAINS } from '@paraspell/xcm-router';

import { ASSET_CLAIM_SUPPORTED_CHAINS } from '../../components/AssetClaim/AssetClaimForm';
import type {
  TCurrencyType,
  TCustomCurrencySymbolSpecifier,
} from '../../components/AssetsQueries/AssetsQueriesForm';
import type { TCurrencyEntry } from '../../components/XcmUtils/XcmUtilsForm';
import { DEFAULT_ADDRESS } from '../../constants';
import { ASSET_QUERIES, PALLETS_QUERIES } from '../../consts';
import type { TApiType, TAssetsQuery, TPalletsQuery } from '../../types';
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

function isValidExchangeChain(value: string): value is TExchangeChain {
  return EXCHANGE_CHAINS.includes(value as TExchangeChain);
}

function isValidAssetQuery(value: string | null): value is TAssetsQuery {
  return value !== null && ASSET_QUERIES.includes(value as TAssetsQuery);
}

function isValidPalletsQuery(value: string | null): value is TPalletsQuery {
  return value !== null && PALLETS_QUERIES.includes(value as TPalletsQuery);
}

export function encodeCurrencyList(currencies: TCurrencyEntry[]) {
  const json = JSON.stringify(currencies);
  return encodeURIComponent(btoa(json));
}

export function decodeCurrencyList(s: string | null): TCurrencyEntry[] {
  if (!s) {
    return [
      {
        currencyOptionId: '',
        customCurrency: '',
        amount: '10',
        isCustomCurrency: false,
        isMax: false,
        customCurrencyType: 'id',
        customCurrencySymbolSpecifier: 'auto',
      },
    ];
  }

  const json = atob(decodeURIComponent(s));
  return JSON.parse(json) as TCurrencyEntry[];
}

export function encodeFeeAsset(
  feeAsset: Omit<TCurrencyEntry, 'amount' | 'isMax'>,
) {
  const json = JSON.stringify(feeAsset);
  return encodeURIComponent(btoa(json));
}

export function decodeFeeAsset(
  s: string | null,
): Omit<TCurrencyEntry, 'amount' | 'isMax'> {
  if (!s) {
    return {
      currencyOptionId: '',
      customCurrency: '',
      isCustomCurrency: false,
      customCurrencyType: 'id',
      customCurrencySymbolSpecifier: 'auto',
    };
  }

  const json = atob(decodeURIComponent(s));
  return JSON.parse(json) as Omit<TCurrencyEntry, 'amount' | 'isMax'>;
}

export function decodeRecipientAddress(s: string | null): string {
  return s !== null && isValidWalletAddress(s) ? s : DEFAULT_ADDRESS;
}

export function decodeString(s: string | null): string {
  return s ?? '';
}

export function decodeAmount(s: string | null): string {
  return s !== null ? s : '10';
}

export function encodeApiType(e: TApiType | undefined): string | undefined {
  if (!e) {
    return undefined;
  }
  return e.toString();
}

export function decodeApiType(s: string | null): TApiType | undefined {
  return (s as TApiType) ?? undefined;
}

export function decodeSubstrateChain(s: string | null): TSubstrateChain {
  return isValidSubstrateChain(s) ? s : 'Astar';
}

export function decodeChain(s: string | null): TChain {
  return isValidChain(s) ? s : 'Hydration';
}

export function decodeEvmChain(s: string | null): TEvmChainFrom {
  return isValidEvmChain(s) ? s : 'Ethereum';
}

export function decodeAssetClaimChain(s: string | null): TSubstrateChain {
  return isValidAssetClaimChain(s) ? s : 'Polkadot';
}

export function encodeBoolean(value: boolean): string {
  return value ? 'true' : 'false';
}

export function decodeBoolean(value: string | null): boolean {
  return value?.trim().toLowerCase() === 'true' || value === '1';
}

export function encodeString<T extends { toString(): string }>(
  value: T,
): string {
  return value.toString();
}

export function encodeStringOrUndefined<
  T extends { toString(): string } | undefined,
>(value: T): string {
  return value !== undefined ? value.toString() : '';
}

export function decodeAssetQuery(s: string | null): TAssetsQuery {
  return isValidAssetQuery(s) ? s : 'ASSETS_OBJECT';
}

export function decodeCurrencyType(s: string | null): TCurrencyType {
  return s !== null && ['id', 'symbol', 'location'].includes(s)
    ? (s as TCurrencyType)
    : 'symbol';
}

export function decodeCurrencySymbolSpecifier(
  s: string | null,
): TCustomCurrencySymbolSpecifier | undefined {
  return s !== null &&
    ['auto', 'native', 'foreign', 'foreignAbstract'].includes(s)
    ? (s as TCustomCurrencySymbolSpecifier)
    : undefined;
}

export function decodePalletsQuery(s: string | null): TPalletsQuery {
  return isValidPalletsQuery(s) ? s : 'ALL_PALLETS';
}

export function encodeExchanges(e: TExchangeChain[] | undefined): string {
  if (!e) {
    return '';
  }
  return e.join(',');
}

export function decodeExchanges(
  s: string | null,
): TExchangeChain[] | undefined {
  if (!s) {
    return undefined;
  }
  return s
    .split(',')
    .filter(Boolean)
    .filter((exchange) => isValidExchangeChain(exchange));
}

export function decodePercentage(s: string | null): string {
  if (!s) return '1';
  const num = Number(s);
  return !isNaN(num) && num >= 0 && num <= 100 ? num.toString() : '1';
}

export function setOrDelete(
  params: URLSearchParams,
  key: string,
  value?: string | null,
) {
  if (value && value.length) params.set(key, value);
  else params.delete(key);
}

export function encodeCodeString(s: string): string {
  return encodeURIComponent(btoa(s));
}

export function decodeCodeString(s: string | null): string {
  if (!s) {
    return '';
  }
  return atob(decodeURIComponent(s));
}
