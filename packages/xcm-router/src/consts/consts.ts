/**
 * Supported exchange chains
 */
export const EXCHANGE_CHAINS = [
  'AssetHubPolkadotDex',
  'AssetHubKusamaDex',
  'AssetHubPaseoDex',
  'AssetHubWestendDex',
  'HydrationDex',
  'KaruraDex',
  'AcalaDex',
  'BifrostKusamaDex',
  'BifrostPolkadotDex',
] as const;

export const FEE_BUFFER_PCT = 10;
export const DEST_FEE_BUFFER_PCT = -1;

export const FALLBACK_FEE_CALC_ADDRESS = '5EtHZF4E8QagNCz6naobCkCAUT52SbcEqaXiDUu2PjUHxZid';
export const FALLBACK_FEE_CALC_EVM_ADDRESS = '0x1501C1413e4178c38567Ada8945A80351F7B8496';
