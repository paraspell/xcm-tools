import { createScriptProgress } from '../../sdk-common/scripts/progress';
import { filterRequestedChains, writeJsonSync } from '../../sdk-common/scripts/scriptUtils';
import type ExchangeChain from '../src/exchanges/ExchangeChain';
import { createExchangeInstance } from '../src/exchanges/ExchangeChainFactory';
import type { TDexConfigStored, TAssetsRecord } from '../src/types';
import assetsMapJson from '../src/consts/assets.json' with { type: 'json' };
import { EXCHANGE_CHAINS, TExchangeChain } from '@paraspell/sdk';

process.on('unhandledRejection', (reason) => {
  console.warn('Suppressed unhandled rejection from WS provider:', reason);
});

const assetsMap = assetsMapJson as TAssetsRecord;

const FETCH_TIMEOUT_MS = 60000;

const acquireApi = async (dex: ExchangeChain) => {
  if (dex.apiType === 'PJS') {
    const api = await dex.createApiInstance();
    return { api, release: () => api.disconnect() };
  }
  const api = await dex.createApiInstancePapi();
  return {
    api,
    release: async () => {
      api.destroy();
    },
  };
};

const fetchWithTimeout = async (
  exchangeChain: TExchangeChain,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<TDexConfigStored> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  const dex = createExchangeInstance(exchangeChain);
  const { api, release } = await acquireApi(dex);

  try {
    return await Promise.race([dex.getDexConfig(api), timeoutPromise]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to fetch ${exchangeChain} assets: ${errorMessage}`);
    if (assetsMap[exchangeChain]) {
      console.log(`Using existing config for ${exchangeChain}`);
      return assetsMap[exchangeChain];
    }
    throw error;
  } finally {
    await release();
  }
};

void (async () => {
  const record: Partial<Record<TExchangeChain, TDexConfigStored>> = {};

  const exchangeChains = filterRequestedChains(EXCHANGE_CHAINS, (chain) => chain);
  const progress = createScriptProgress(exchangeChains, 'Swap assets', FETCH_TIMEOUT_MS);

  for (const exchangeChain of exchangeChains) {
    progress.update(exchangeChain);

    try {
      const dexConfig = await fetchWithTimeout(exchangeChain, FETCH_TIMEOUT_MS);
      record[exchangeChain] = dexConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Failed to fetch ${exchangeChain} assets:`, errorMessage);
      if (!assetsMap[exchangeChain]) {
        console.error(`No existing config found for ${exchangeChain}, skipping...`);
        continue;
      }
    }
  }

  progress.stop();

  const merged: TAssetsRecord = {
    ...assetsMap,
    ...record,
  };

  writeJsonSync('./src/consts/assets.json', merged);
  console.log('Assets update complete!');
  process.exit(0);
})();
