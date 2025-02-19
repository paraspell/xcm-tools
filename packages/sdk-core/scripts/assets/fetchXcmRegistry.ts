import axios from 'axios'

export type TAssets = {
  polkadot: TRegistryAssetData[]
  kusama: TRegistryAssetData[]
}

export type TRegistryAssetData = {
  relayChain: string
  paraID: number
  id: string
  xcAssetCnt: string
  data: TRegistryAssets[]
}

export type TXcmRegistryAssetData = {
  relayChain: string
  registryCnt: string
  data: Record<string, TXcmRegistryAsset>
}

export type TXcmRegistryAsset = {
  paraID: number
  relayChain: string
  nativeChainID: string | null
  symbol: string
  decimals: number
  xcmV1MultiLocation: { v1: object }
  asset: object | string
  currencyID: string | undefined
  xcmInteriorKey: string
}

export type TRegistryAssets = {
  paraID: number
  relayChain: string
  nativeChainID: string | null
  symbol: string
  decimals: number
  xcmV1MultiLocation: object
  asset: object | string
  currencyID: string | undefined
  xcmInteriorKey: string
}

export type TGlobalAssetRegistry = {
  xcAssets: TAssets
  assets: TAssets
  xcmRegistry: TXcmRegistryAssetData[]
}

export const fetchXcmRegistry = async (): Promise<TGlobalAssetRegistry> => {
  const response = await axios.get<TGlobalAssetRegistry>(
    'https://cdn.jsdelivr.net/gh/colorfulnotion/xcm-global-registry/metadata/xcmgar.json'
  )
  return response.data
}
