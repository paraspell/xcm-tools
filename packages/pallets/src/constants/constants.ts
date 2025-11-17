export const CROSSCHAIN_PALLETS = ['XTokens', 'PolkadotXcm', 'XTransfer', 'XcmPallet'] as const

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

export const OTHER_PALLETS = ['Utility'] as const

export const PALLETS = [...CROSSCHAIN_PALLETS, ...ASSETS_PALLETS, ...OTHER_PALLETS] as const
