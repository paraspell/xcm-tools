import fs from 'fs';
import { EXCHANGE_NODES } from '../src/consts/consts';
import createDexNodeInstance from '../src/dexNodes/DexNodeFactory';
import { TAssetSymbols } from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const writeJsonSync = (path: string, data: any) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

void (async () => {
  const record: Record<string, TAssetSymbols> = {};
  for (const exchangeNode of EXCHANGE_NODES) {
    console.log(`Fetching ${exchangeNode} assets...`);
    const dex = createDexNodeInstance(exchangeNode);
    const api = await dex.createApiInstance();
    const symbols = await dex.getAssetSymbols(api);
    record[exchangeNode] = symbols;
  }
  writeJsonSync('./src/consts/assets.json', record);
  process.exit(0);
})();
