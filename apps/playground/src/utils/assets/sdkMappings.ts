import type { TApiType, TCurrencyCore } from '@paraspell/sdk';
import {
  findAssetInfo,
  findAssetInfoOrThrow,
  getAllAssetsSymbols,
  getAssetLocation,
  getAssetReserveChain,
  getAssetsObject,
  getBridgeStatus,
  getExistentialDeposit,
  getFeeAssets,
  getNativeAssets,
  getOtherAssets,
  getParaId,
  getRelayChainSymbol,
  getSupportedAssets,
  getSupportedDestinations,
  hasDryRunSupport,
} from '@paraspell/sdk';

import type { FormValuesResolved } from '../../components/AssetsQueries/AssetsQueriesForm';
import type { TAssetsQuery } from '../../types';
import { importSdk } from '../importSdk';

export const callSdkFunc = async (
  formValues: FormValuesResolved,
  apiType: TApiType,
  resolvedCurrency: TCurrencyCore | undefined,
): Promise<unknown> => {
  const { func, chain, destination, address } = formValues;
  const sdk = await importSdk(apiType);

  const sdkActions: Record<TAssetsQuery, () => Promise<unknown>> = {
    ASSETS_OBJECT: () => Promise.resolve(getAssetsObject(chain)),
    ASSET_LOCATION: () =>
      Promise.resolve(getAssetLocation(chain, resolvedCurrency!)),
    ASSET_RESERVE_CHAIN: () => {
      const { location } = findAssetInfoOrThrow(chain, resolvedCurrency!);
      return Promise.resolve(getAssetReserveChain(chain, location));
    },
    ASSET_INFO: () =>
      Promise.resolve(findAssetInfo(chain, resolvedCurrency!, destination)),
    RELAYCHAIN_SYMBOL: () => Promise.resolve(getRelayChainSymbol(chain)),
    NATIVE_ASSETS: () => Promise.resolve(getNativeAssets(chain)),
    OTHER_ASSETS: () => Promise.resolve(getOtherAssets(chain)),
    SUPPORTED_ASSETS: () =>
      Promise.resolve(getSupportedAssets(chain, destination)),
    FEE_ASSETS: () => Promise.resolve(getFeeAssets(chain)),
    ALL_SYMBOLS: () => Promise.resolve(getAllAssetsSymbols(chain)),
    PARA_ID: () => Promise.resolve(getParaId(chain)),
    CONVERT_SS58: () => Promise.resolve(sdk.convertSs58(address, chain)),
    ASSET_BALANCE: () =>
      sdk.getBalance({
        address,
        chain,
        currency: resolvedCurrency!,
      }),
    EXISTENTIAL_DEPOSIT: () =>
      Promise.resolve(getExistentialDeposit(chain, resolvedCurrency)),
    HAS_DRY_RUN_SUPPORT: () => Promise.resolve(hasDryRunSupport(chain)),
    ETHEREUM_BRIDGE_STATUS: () => Promise.resolve(getBridgeStatus()),
    PARA_ETH_FEES: () => Promise.resolve(sdk.getParaEthTransferFees()),
    SUPPORTED_DESTINATIONS: () =>
      Promise.resolve(getSupportedDestinations(chain, resolvedCurrency!)),
  };

  const action = sdkActions[func];
  if (!action) {
    throw new Error(`Unsupported function: ${func}`);
  }

  return action();
};
