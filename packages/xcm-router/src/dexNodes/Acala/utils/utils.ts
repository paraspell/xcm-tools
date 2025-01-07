import { ApiPromise, WsProvider } from '@polkadot/api';
import { options } from '@acala-network/api';
import type { TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import { getNodeProviders } from '@paraspell/sdk-pjs';
import { type Wallet } from '@acala-network/sdk';

export const createAcalaApiInstance = async (node: TNodePolkadotKusama): Promise<ApiPromise> => {
  const provider = new WsProvider(getNodeProviders(node), 100);
  const api = new ApiPromise(
    options({
      provider,
    }),
  );
  await api.isReady;
  return api;
};

export const convertCurrency = async (
  wallet: Wallet,
  nativeCurrencySymbol: string,
  otherCurrencySymbol: string,
  otherCurrencyAmount: number,
): Promise<number> => {
  const nativeUsdPrice = (await wallet.getPrice(nativeCurrencySymbol)).toNumber();
  const otherUsdPrice = (await wallet.getPrice(otherCurrencySymbol)).toNumber();

  if (otherUsdPrice === 0) {
    throw new Error(`Could not fetch price for ${otherCurrencySymbol}`);
  }

  const feeInUsd = otherCurrencyAmount * nativeUsdPrice;
  return feeInUsd / otherUsdPrice;
};
