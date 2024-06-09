import { prodRelayPolkadot } from '@polkadot/apps-config/endpoints';

const EXCLUDED_NODE_NAMES = new Set([
  'Energy Web X',
  'Frequency',
  'Laos',
  'Geminis',
  'Hashed Network',
  'Hyperbridge (Nexus)',
  'SORA',
  'Kapex',
  'KILT Spiritnet',
  'Logion',
  'peaq',
  'OAK Network',
  'Watr Network',
  't3rn',
  'OmniBTC',
  'InvArch',
  'Polimec',
  'Equilibrium',
  'Continuum',
  'Coinversation',
  'Efinity',
  'Kylin',
  'Clover',
  'Integritee Network',
  'Ajuna Network',
  'Ares Odyssey',
  'SubGame Gamma',
  'Moonsama',
  'Aventus',
  'SubDAO',
  'Mythos'
]);

export const POLKADOT_NODE_NAMES = [
  ...new Set(
    prodRelayPolkadot.linked?.map(node => node.text).filter(name => !EXCLUDED_NODE_NAMES.has(name))
  )
];
