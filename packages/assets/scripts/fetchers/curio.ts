/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

const fetchCurioMetadata = async (client: PolkadotClient) =>
  client.getUnsafeApi().query.AssetRegistry.Metadata.getEntries()

const mapAsset = ({ keyArgs: [key], value }: any): TAssetInfoNoLoc => ({
  ...(key.type !== 'Token' && { assetId: String(key.value) }),
  symbol: decodeSymbol(value.symbol),
  decimals: value.decimals,
  existentialDeposit: edString(value),
  location: normalizeLocation(value.location)
})

export const fetchCurioAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> =>
  (await fetchCurioMetadata(client))
    .filter(({ keyArgs: [key] }: any) => key?.type === 'ForeignAsset')
    .map(mapAsset)

export const fetchCurioNativeAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> =>
  (await fetchCurioMetadata(client))
    .filter(({ keyArgs: [key] }: any) => key?.type === 'Token')
    .map(entry => ({ ...mapAsset(entry), isNative: true }))
