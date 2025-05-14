import { capitalizeMultiLocation } from '../../assets/scripts/fetchOtherAssetsRegistry';
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
    const isAh = exchangeNode === 'AssetHubPolkadotDex' || exchangeNode === 'AssetHubKusamaDex';
    record[exchangeNode] = isAh
      ? {
          ...dexConfig,
          pairs: dexConfig.pairs.map(([a, b]) => {
            return [
              typeof a === 'string' ? a : capitalizeMultiLocation(a),
              typeof b === 'string' ? b : capitalizeMultiLocation(b),
            ];
          }),
        }
      : dexConfig;
  }
  writeJsonSync('./src/consts/assets.json', record);
  process.exit(0);
})();
