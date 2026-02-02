import { writeJsonSync } from '../../sdk-common/scripts/scriptUtils';
import { EXCHANGE_CHAINS } from '../src/consts';
import { createExchangeInstance } from '../src/exchanges/ExchangeChainFactory';
import type { TDexConfig, TAssetsRecord, TExchangeChain } from '../src/types';
import assetsMapJson from '../src/consts/assets.json' with { type: 'json' };
import { addAliasesToDuplicateSymbols } from './addAliases';

const assetsMap = assetsMapJson as TAssetsRecord;

const fetchWithTimeout = async (
  exchangeChain: TExchangeChain,
  timeoutMs: number = 60000,
): Promise<TDexConfig> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  const fetchPromise = (async (): Promise<TDexConfig> => {
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
  const record: Record<string, TDexConfig> = {};

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

  addAliasesToDuplicateSymbols(merged);

  writeJsonSync('./src/consts/assets.json', merged);
  console.log('Assets update complete!');
  process.exit(0);
})();
