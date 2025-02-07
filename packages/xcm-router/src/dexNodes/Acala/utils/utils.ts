import { ApiPromise, WsProvider } from '@polkadot/api';
import { options } from '@acala-network/api';
import type { TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import { getNodeProviders } from '@paraspell/sdk-pjs';

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
