import * as Sdk from '@paraspell/sdk';
import * as SdkPjs from '@paraspell/sdk-pjs';
import {
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetMultiLocation,
  getAssetsObject,
  getNativeAssets,
  getOtherAssets,
  getParaId,
  getRelayChainSymbol,
  hasSupportForAsset,
} from '@paraspell/sdk';
import type {
  TCurrencyCore,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
} from '@paraspell/sdk';
import type { FormValues } from '../../components/AssetsQueries/AssetsQueriesForm';
import type { TApiType, TAssetsQuery } from '../../types';

export const callSdkFunc = (
  formValues: FormValues,
  apiType: TApiType,
  resolvedCurrency: TCurrencyCore,
): Promise<unknown> => {
  const {
    func,
    node,
    nodeDestination,
    currency,
    amount,
    address,
    accountDestination,
  } = formValues;
  const chosenSdk = apiType === 'PAPI' ? Sdk : SdkPjs;

  const sdkActions: Record<TAssetsQuery, () => Promise<unknown>> = {
    ASSETS_OBJECT: () => Promise.resolve(getAssetsObject(node)),
    ASSET_ID: () =>
      Promise.resolve(getAssetId(node as TNodePolkadotKusama, currency)),
    ASSET_MULTILOCATION: () =>
      Promise.resolve(getAssetMultiLocation(node, resolvedCurrency)),
    RELAYCHAIN_SYMBOL: () => Promise.resolve(getRelayChainSymbol(node)),
    NATIVE_ASSETS: () =>
      Promise.resolve(getNativeAssets(node as TNodePolkadotKusama)),
    OTHER_ASSETS: () => Promise.resolve(getOtherAssets(node)),
    ALL_SYMBOLS: () => Promise.resolve(getAllAssetsSymbols(node)),
    DECIMALS: () => Promise.resolve(getAssetDecimals(node, currency)),
    HAS_SUPPORT: () => Promise.resolve(hasSupportForAsset(node, currency)),
    PARA_ID: () => Promise.resolve(getParaId(node)),
    BALANCE_NATIVE: () =>
      chosenSdk.getBalanceNative({
        address,
        node,
      }),
    BALANCE_FOREIGN: () =>
      chosenSdk.getBalanceForeign({
        address,
        node: node as TNodePolkadotKusama,
        currency: resolvedCurrency,
      }),
    ASSET_BALANCE: () =>
      chosenSdk.getAssetBalance({
        address,
        node: node,
        currency: resolvedCurrency,
      }),
    MAX_NATIVE_TRANSFERABLE_AMOUNT: () =>
      chosenSdk.getMaxNativeTransferableAmount({
        address,
        node: node,
        currency:
          'symbol' in resolvedCurrency &&
          typeof resolvedCurrency.symbol === 'string' &&
          resolvedCurrency.symbol.length > 0
            ? { symbol: resolvedCurrency.symbol }
            : undefined,
      }),
    MAX_FOREIGN_TRANSFERABLE_AMOUNT: () =>
      chosenSdk.getMaxForeignTransferableAmount({
        address,
        node: node as TNodePolkadotKusama,
        currency: resolvedCurrency,
      }),
    TRANSFERABLE_AMOUNT: () =>
      chosenSdk.getTransferableAmount({
        address,
        node: node as TNodePolkadotKusama,
        currency: resolvedCurrency,
      }),
    EXISTENTIAL_DEPOSIT: () =>
      Promise.resolve(
        chosenSdk.getExistentialDeposit(
          node as TNodeWithRelayChains,
          (resolvedCurrency as { symbol: string }).symbol.length > 0
            ? (resolvedCurrency as { symbol: string })
            : undefined,
        ),
      ),
    ORIGIN_FEE_DETAILS: () =>
      chosenSdk.getOriginFeeDetails({
        origin: node,
        destination: nodeDestination,
        currency: {
          ...resolvedCurrency,
          amount,
        },
        account: address,
        accountDestination,
      }),
  };

  const action = sdkActions[func];
  if (!action) {
    throw new Error(`Unsupported function: ${func}`);
  }

  return action();
};
