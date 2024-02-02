export const API_URL = 'https://api.lightspell.xyz';

export const ASSET_QUERIES = [
  'ASSETS_OBJECT',
  'ASSET_ID',
  'RELAYCHAIN_SYMBOL',
  'NATIVE_ASSETS',
  'OTHER_ASSETS',
  'ALL_SYMBOLS',
  'DECIMALS',
  'HAS_SUPPORT',
  'PARA_ID',
] as const;

export const PALLETS_QUERIES = ['ALL_PALLETS', 'DEFAULT_PALLET'] as const;

export const CHANNELS_QUERIES = ['OPEN_CHANNEL', 'CLOSE_CHANNEL'] as const;
