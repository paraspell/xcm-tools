import { type TChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findAssetInfo } from '../assets'
import { type TAssetInfo } from '../types'
import { getAssetLocation } from './getAssetLocation'

vi.mock('../assets/search')

describe('getAssetLocation', () => {
  const chain: TChain = 'Acala'
  const currency = { symbol: 'ACA' }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns null if asset is not found', () => {
    vi.mocked(findAssetInfo).mockReturnValue(null)
    const result = getAssetLocation(chain, currency)
    expect(result).toBeNull()
  })

  it('returns null if asset location does not exists', () => {
    const asset = { symbol: 'TEST' } as TAssetInfo
    vi.mocked(findAssetInfo).mockReturnValue(asset)
    const result = getAssetLocation(chain, currency)
    expect(result).toBeNull()
  })
})
