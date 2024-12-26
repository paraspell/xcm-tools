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

export const fetchXcmRegistry = async (): Promise<{ xcAssets: TAssets; assets: TAssets }> => {
  const response = await axios.get<{ xcAssets: TAssets; assets: TAssets }>(
    'https://cdn.jsdelivr.net/gh/colorfulnotion/xcm-global-registry/metadata/xcmgar.json'
  )
  return response.data
}
