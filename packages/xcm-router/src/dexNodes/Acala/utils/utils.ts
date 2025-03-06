import { options } from '@acala-network/api';
import type { TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import { getNodeProviders } from '@paraspell/sdk-pjs';
import { ApiPromise, WsProvider } from '@polkadot/api';

export const createAcalaApiInstance = async (node: TNodePolkadotKusama): Promise<ApiPromise> => {
  const provider = new WsProvider(getNodeProviders(node).reverse());
  const api = new ApiPromise(
    options({
      provider,
    }),
  );
  await api.isReady;
  return api;
};
