import type { TAssetInfo } from '@paraspell/assets'
import { findNativeAssetInfoOrThrow } from '@paraspell/assets'
import { hasJunction } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../chains/config'
import { inferFeeAsset } from './inferFeeAsset'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common')
vi.mock('../../chains/config')

describe('inferFeeAsset', () => {
  const nativeAsset = { symbol: 'GLMR', decimals: 18 } as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(getParaId).mockReturnValue(2004)
  })

  it('returns native asset for Hydration -> Moonbeam with Moonbeam WH asset', () => {
    vi.mocked(hasJunction).mockReturnValue(true)

    const asset = { symbol: 'WETH.wh', location: { parents: 1, interior: {} } } as TAssetInfo

    const result = inferFeeAsset('Hydration', 'Moonbeam', asset)

    expect(result).toBe(nativeAsset)
    expect(findNativeAssetInfoOrThrow).toHaveBeenCalledWith('Moonbeam')
  })

  it('returns undefined when conditions are not met', () => {
    vi.mocked(hasJunction).mockReturnValue(true)

    const asset = { symbol: 'WETH.wh', location: { parents: 1, interior: {} } } as TAssetInfo

    expect(inferFeeAsset('Acala', 'Moonbeam', asset)).toBeUndefined()
    expect(inferFeeAsset('Hydration', 'Astar', asset)).toBeUndefined()

    vi.mocked(hasJunction).mockReturnValue(false)
    expect(inferFeeAsset('Hydration', 'Moonbeam', asset)).toBeUndefined()
  })
})
