import { prodRelayPolkadot } from '@polkadot/apps-config/endpoints';

export const NAME = 'XCMVisualizator';

const EXCLUDED_NODE_NAMES = new Set([
  'Kapex',
  'peaq',
  'OAK Network',
  'OmniBTC',
  'Equilibrium',
  'Coinversation',
  'Efinity',
  'Kylin',
  'Clover',
  'Ares Odyssey',
  'SubGame Gamma',
  'Moonsama',
  'SubDAO',
  'Geminis'
]);

export const POLKADOT_NODE_NAMES = [
  ...new Set(
    prodRelayPolkadot.linked?.map(node => node.text).filter(name => !EXCLUDED_NODE_NAMES.has(name))
  )
];
