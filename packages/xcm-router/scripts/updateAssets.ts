import { writeJsonSync } from '../../sdk-common/scripts/scriptUtils';
import { EXCHANGE_NODES } from '../src/consts';
import { createDexNodeInstance } from '../src/dexNodes/DexNodeFactory';
import type { TDexConfig } from '../src/types';

void (async () => {
  const record: Record<string, TDexConfig> = {};
  for (const exchangeNode of EXCHANGE_NODES) {
    console.log(`Fetching ${exchangeNode} assets...`);
    const dex = createDexNodeInstance(exchangeNode);
    const api = await dex.createApiInstance();
    const dexConfig = await dex.getDexConfig(api);
    record[exchangeNode] = dexConfig;
  }
  writeJsonSync('./src/consts/assets.json', record);
  process.exit(0);
})();
