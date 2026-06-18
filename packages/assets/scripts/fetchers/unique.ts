/* eslint-disable @typescript-eslint/no-explicit-any */
import { CHAINS, type TLocation } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import { getParaId } from '../../../sdk-core/src'
import { findAssetInfo } from '../../src'
import type { TAssetInfoNoLoc } from '../types'
import { normalizeLocation } from '../utils/codecUtils'

const findSimilarAsset = (location: TLocation | undefined) => {
  if (!location) return null
  if (location.interior !== 'Here' && (location.interior as any).X3) {
    const x3 = (location.interior as any).X3
    if (x3[0].Parachain === getParaId('AssetHubPolkadot')) {
      const asset = findAssetInfo('AssetHubPolkadot', { id: x3[2].GeneralIndex })
      if (asset) return asset
    }
  }
  for (const chain of CHAINS) {
    const asset = findAssetInfo(chain, { location })
    if (asset) return asset
  }
  return null
}

export const fetchUniqueAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.ForeignAssets.CollectionToForeignAsset.getEntries()

  return entries.map(({ keyArgs: [id], value }: any) => {
    const concrete = value?.type === 'Concrete' ? value.value : (value?.concrete ?? value)
    const location = normalizeLocation(concrete)
    const asset = findSimilarAsset(location)
    return {
      assetId: String(id),
      symbol: asset?.symbol ?? '',
      decimals: asset?.decimals ?? 0,
      location,
      existentialDeposit: '0'
    }
  })
}
