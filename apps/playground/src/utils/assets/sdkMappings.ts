import type { TCurrencyCore } from '@paraspell/sdk';
import * as Sdk from '@paraspell/sdk';
import {
  findAssetInfoOrThrow,
  getAllAssetsSymbols,
  getAssetDecimals,
  getAssetId,
  getAssetLocation,
  getAssetReserveChain,
  getAssetsObject,
  getFeeAssets,
  getNativeAssets,
  getOtherAssets,
  getParaId,
  getRelayChainSymbol,
  getSupportedAssets,
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
  const { func, chain, destination, currency, address } = formValues;
  const chosenSdk = apiType === 'PAPI' ? Sdk : SdkPjs;

  const sdkActions: Record<TAssetsQuery, () => Promise<unknown>> = {
    ASSETS_OBJECT: () => Promise.resolve(getAssetsObject(chain)),
    ASSET_ID: () => Promise.resolve(getAssetId(chain, currency)),
    ASSET_LOCATION: () =>
      Promise.resolve(getAssetLocation(chain, resolvedCurrency)),
    ASSET_RESERVE_CHAIN: () => {
      const { location } = findAssetInfoOrThrow(chain, resolvedCurrency, null);
      return Promise.resolve(getAssetReserveChain(chain, location));
    },
    ASSET_INFO: () =>
      Promise.resolve(
        chosenSdk.findAssetInfo(chain, resolvedCurrency, destination),
      ),
    RELAYCHAIN_SYMBOL: () => Promise.resolve(getRelayChainSymbol(chain)),
    NATIVE_ASSETS: () => Promise.resolve(getNativeAssets(chain)),
    OTHER_ASSETS: () => Promise.resolve(getOtherAssets(chain)),
    SUPPORTED_ASSETS: () =>
      Promise.resolve(getSupportedAssets(chain, destination)),
    FEE_ASSETS: () => Promise.resolve(getFeeAssets(chain)),
    ALL_SYMBOLS: () => Promise.resolve(getAllAssetsSymbols(chain)),
    DECIMALS: () => Promise.resolve(getAssetDecimals(chain, currency)),
    HAS_SUPPORT: () => Promise.resolve(hasSupportForAsset(chain, currency)),
    PARA_ID: () => Promise.resolve(getParaId(chain)),
    CONVERT_SS58: () => Promise.resolve(chosenSdk.convertSs58(address, chain)),
    ASSET_BALANCE: () =>
      chosenSdk.getBalance({
        address,
        chain,
        currency: resolvedCurrency,
      }),
    EXISTENTIAL_DEPOSIT: () =>
      Promise.resolve(
        chosenSdk.getExistentialDeposit(
          chain,
          (resolvedCurrency as { symbol: string }).symbol.length > 0
            ? (resolvedCurrency as { symbol: string })
            : undefined,
        ),
      ),
    HAS_DRY_RUN_SUPPORT: () =>
      Promise.resolve(chosenSdk.hasDryRunSupport(chain)),
    ETHEREUM_BRIDGE_STATUS: () => Promise.resolve(chosenSdk.getBridgeStatus()),
    PARA_ETH_FEES: () => Promise.resolve(chosenSdk.getParaEthTransferFees()),
    SUPPORTED_DESTINATIONS: () =>
      Promise.resolve(
        chosenSdk.getSupportedDestinations(chain, resolvedCurrency),
      ),
  };

  const action = sdkActions[func];
  if (!action) {
    throw new Error(`Unsupported function: ${func}`);
  }

  return action();
};
