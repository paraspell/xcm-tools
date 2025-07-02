import { writeJsonSync } from '../../sdk-common/scripts/scriptUtils';
import { EXCHANGE_NODES } from '../src/consts';
import { createDexNodeInstance } from '../src/dexNodes/DexNodeFactory';
import type { TDexConfig, TAssetsRecord, TExchangeNode } from '../src/types';
import * as assetsMapJson from '../src/consts/assets.json' with { type: 'json' };

const assetsMap = assetsMapJson as TAssetsRecord;

const fetchWithTimeout = async (
  exchangeNode: TExchangeNode,
  timeoutMs: number = 60000,
): Promise<TDexConfig> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  const fetchPromise = (async (): Promise<TDexConfig> => {
    const dex = createDexNodeInstance(exchangeNode);
    const api = await dex.createApiInstance();
    return await dex.getDexConfig(api);
  })();

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to fetch ${exchangeNode} assets: ${errorMessage}`);
    if (assetsMap[exchangeNode]) {
      console.log(`Using existing config for ${exchangeNode}`);
      return assetsMap[exchangeNode];
    }
    throw error;
  }
};

void (async () => {
  const record: Record<string, TDexConfig> = {};

  for (const exchangeNode of EXCHANGE_NODES) {
    console.log(`Fetching ${exchangeNode} assets...`);

    try {
      const dexConfig = await fetchWithTimeout(exchangeNode, 60000);
      record[exchangeNode] = dexConfig;
      console.log(`✓ Successfully fetched ${exchangeNode} assets`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Failed to fetch ${exchangeNode} assets:`, errorMessage);
      if (!assetsMap[exchangeNode]) {
        console.error(`No existing config found for ${exchangeNode}, skipping...`);
        continue;
      }
    }
  }

  writeJsonSync('./src/consts/assets.json', record);
  console.log('Assets update complete!');
  process.exit(0);
})();
