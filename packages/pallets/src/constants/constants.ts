export const CROSSCHAIN_PALLETS = ['XTokens', 'PolkadotXcm', 'XcmPallet'] as const

export const ASSETS_PALLETS = [
  'Balances',
  'Tokens',
  'Currencies',
  'Assets',
  'ForeignAssets',
  'AssetManager',
  'System',
  'Fungibles',
  'OrmlTokens'
] as const

export const OTHER_PALLETS = ['Utility', 'AssetConversion'] as const

export const PALLETS = [...CROSSCHAIN_PALLETS, ...ASSETS_PALLETS, ...OTHER_PALLETS] as const

export const NATIVE_ASSETS_PALLET_PRIORITY = ['Balances', 'Currencies', 'Tokens'] as const

export const OTHER_ASSETS_PALLET_PRIORITY = [
  'Currencies',
  'Tokens',
  'Assets',
  'ForeignAssets',
  'AssetManager',
  'Fungibles',
  'OrmlTokens'
] as const
