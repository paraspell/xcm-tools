import { writeJsonSync } from '../../sdk-common/scripts/scriptUtils';
import { createExchangeInstance } from '../src/exchanges/ExchangeChainFactory';
import type { TDexConfigStored, TAssetsRecord } from '../src/types';
import assetsMapJson from '../src/consts/assets.json' with { type: 'json' };
import { EXCHANGE_CHAINS, TExchangeChain } from '@paraspell/sdk';

const assetsMap = assetsMapJson as TAssetsRecord;

const fetchWithTimeout = async (
  exchangeChain: TExchangeChain,
  timeoutMs: number = 60000,
): Promise<TDexConfigStored> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  const fetchPromise = (async (): Promise<TDexConfigStored> => {
    const dex = createExchangeInstance(exchangeChain);
    const api = await dex.createApiInstance();
    return await dex.getDexConfig(api);
  })();

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to fetch ${exchangeChain} assets: ${errorMessage}`);
    if (assetsMap[exchangeChain]) {
      console.log(`Using existing config for ${exchangeChain}`);
      return assetsMap[exchangeChain];
    }
    throw error;
  }
};

void (async () => {
  const record: Partial<Record<TExchangeChain, TDexConfigStored>> = {};

  for (const exchangeChain of EXCHANGE_CHAINS) {
    console.log(`Fetching ${exchangeChain} assets...`);

    try {
      const dexConfig = await fetchWithTimeout(exchangeChain, 60000);
      record[exchangeChain] = dexConfig;
      console.log(`✓ Successfully fetched ${exchangeChain} assets`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Failed to fetch ${exchangeChain} assets:`, errorMessage);
      if (!assetsMap[exchangeChain]) {
        console.error(`No existing config found for ${exchangeChain}, skipping...`);
        continue;
      }
    }
  }

  const merged: TAssetsRecord = {
    ...assetsMap,
    ...record,
  };

  writeJsonSync('./src/consts/assets.json', merged);
  console.log('Assets update complete!');
  process.exit(0);
})();
