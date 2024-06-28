import { type TExchangeNode } from '../types';
import AcalaExchangeNode from './Acala/AcalaDex';
import BifrostExchangeNode from './Bifrost/BifrostDex';
import type ExchangeNode from './DexNode';
import HydraDxExchangeNode from './HydraDx/HydraDxDex';
import InterlayExchangeNode from './Interlay/InterlayDex';

export const record: Record<TExchangeNode, ExchangeNode> = {
  // Reuse classes for Kusama equivalents
  HydraDxDex: new HydraDxExchangeNode('HydraDX'),
  BasiliskDex: new HydraDxExchangeNode('Basilisk'),
  AcalaDex: new AcalaExchangeNode('Acala'),
  KaruraDex: new AcalaExchangeNode('Karura'),
  InterlayDex: new InterlayExchangeNode('Interlay'),
  KintsugiDex: new InterlayExchangeNode('Kintsugi'),
  BifrostPolkadotDex: new BifrostExchangeNode('BifrostPolkadot'),
  BifrostKusamaDex: new BifrostExchangeNode('BifrostKusama'),
};

const createDexNodeInstance = (node: TExchangeNode): ExchangeNode => {
  return record[node];
};

export default createDexNodeInstance;
