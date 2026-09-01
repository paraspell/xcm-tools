import type { TChain, TLocation } from '@paraspell/sdk-common'

export type TErc20Info = {
  balanceSlot: number
  // Only set when the asset location does not have AccountKey20 junction
  contract?: string
}

export type TAssetInfo = {
  decimals: number
  symbol: string
  isNative?: boolean
  assetId?: string
  location: TLocation
  existentialDeposit?: string
  isFeeAsset?: boolean
  // Hydration only - ERC20 assets
  erc20?: TErc20Info
  alias?: string
}

export type TAssetInfoWithId = TAssetInfo & {
  assetId: string
}

export type TChainAssetsInfo = {
  relaychainSymbol: string
  nativeAssetSymbol: string
  isEVM: boolean
  ss58Prefix: number
  supportsDryRunApi: boolean
  supportsXcmPaymentApi: boolean
  assets: TAssetInfo[]
}

export type TAssetJsonMap = Record<TChain, TChainAssetsInfo>
