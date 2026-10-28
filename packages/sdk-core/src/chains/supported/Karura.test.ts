import { findAssetInfoOrThrow } from '@paraspell/assets'
import { describe, expect, it } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getChain } from '../../utils'

describe('Karura', () => {
  it('should use KUSD token currency id for aSEED and Acala currency id otherwise', () => {
    const chain = getChain<unknown, unknown, unknown, 'Karura'>('Karura')
    const api = {} as PolkadotApi<unknown, unknown, unknown>
    const aSeed = findAssetInfoOrThrow('Karura', { symbol: 'aSEED' }, null)
    const ksm = findAssetInfoOrThrow('Karura', { symbol: 'KSM' }, null)

    expect(chain.getCustomCurrencyId(api, aSeed)).toEqual({ Token: 'KUSD' })
    expect(chain.getCustomCurrencyId(api, ksm)).toEqual({ Token: 'KSM' })
  })
})
