import type {
  TCurrencyCore,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
} from '@paraspell/sdk';
import * as Sdk from '@paraspell/sdk';
import {
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetMultiLocation,
  getAssetsObject,
  getFeeAssets,
  getNativeAssets,
  getOtherAssets,
  getParaId,
  getRelayChainSymbol,
  hasSupportForAsset,
} from '@paraspell/sdk';
import * as SdkPjs from '@paraspell/sdk-pjs';

import type { FormValues } from '../../components/AssetsQueries/AssetsQueriesForm';
import type { TApiType, TAssetsQuery } from '../../types';

export const callSdkFunc = (
  formValues: FormValues,
  apiType: TApiType,
  resolvedCurrency: TCurrencyCore,
): Promise<unknown> => {
  const { func, node, currency, address } = formValues;
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
    FEE_ASSETS: () => Promise.resolve(getFeeAssets(node)),
    ALL_SYMBOLS: () => Promise.resolve(getAllAssetsSymbols(node)),
    DECIMALS: () => Promise.resolve(getAssetDecimals(node, currency)),
    HAS_SUPPORT: () => Promise.resolve(hasSupportForAsset(node, currency)),
    PARA_ID: () => Promise.resolve(getParaId(node)),
    CONVERT_SS58: () => Promise.resolve(chosenSdk.convertSs58(address, node)),
    ASSET_BALANCE: () =>
      chosenSdk.getAssetBalance({
        address,
        node: node,
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
    HAS_DRY_RUN_SUPPORT: () =>
      Promise.resolve(chosenSdk.hasDryRunSupport(node)),
    ETHEREUM_BRIDGE_STATUS: () => Promise.resolve(chosenSdk.getBridgeStatus()),
    PARA_ETH_FEES: () => Promise.resolve(chosenSdk.getParaEthTransferFees()),
  };

  const action = sdkActions[func];
  if (!action) {
    throw new Error(`Unsupported function: ${func}`);
  }

  return action();
};
