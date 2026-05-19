import { deepEqual, isChain } from '@paraspell/sdk-common'

import { CustomAssetConflictError } from '../errors'
import assetsMapJson from '../maps/assets.json' with { type: 'json' }
import type {
  TAssetInfo,
  TAssetJsonMap,
  TCustomAssetsMap,
  TCustomAssetsMapNormalized
} from '../types'

const baseAssetsMap = assetsMapJson as TAssetJsonMap

export const normalizeCustomAssets = (
  map: TCustomAssetsMap | undefined
): TCustomAssetsMapNormalized => {
  if (!map) return {}
  const result: TCustomAssetsMapNormalized = {}
  for (const [chain, entries] of Object.entries(map)) {
    if (!isChain(chain) || !entries || entries.length === 0) continue
    const base = baseAssetsMap[chain]?.assets ?? []
    for (const entry of entries) {
      if (entry.forceOverride) continue
      const clash = base.find(a => deepEqual(a.location, entry.location))
      if (clash) {
        throw new CustomAssetConflictError(
          `Custom asset '${entry.symbol}' on chain '${chain}' collides on location with registry asset '${clash.symbol}'. Set 'forceOverride: true' to replace it.`
        )
      }
    }
    result[chain] = entries
  }
  return result
}

export const mergeCustomAssets = (
  base: readonly TAssetInfo[],
  overlay: readonly TAssetInfo[] | undefined
): TAssetInfo[] => {
  if (!overlay || overlay.length === 0) return [...base]
  const kept = base.filter(b => !overlay.some(o => deepEqual(o.location, b.location)))
  return [...kept, ...overlay]
}
