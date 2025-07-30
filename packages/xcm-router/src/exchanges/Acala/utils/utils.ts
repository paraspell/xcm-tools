import { options } from '@acala-network/api';
import type { TParachain } from '@paraspell/sdk';
import { getChainProviders } from '@paraspell/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';

export const createAcalaClient = async (chain: TParachain): Promise<ApiPromise> => {
  const provider = new WsProvider(getChainProviders(chain).reverse());
  const api = new ApiPromise(
    options({
      provider,
    }),
  );
  await api.isReady;
  return api;
};
