import { describe, expect, it } from 'vitest'

import type { PolkadotApi } from '../../api'
import { CustomChainInvalidError } from '../../errors'
import { getChainVersion } from './getChainVersion'

describe('getChainVersion', () => {
  it('throws CustomChainInvalidError for an unregistered custom chain', () => {
    const api = { _customCtx: { customChains: {} } } as PolkadotApi<unknown, unknown, unknown>

    expect(() => getChainVersion<unknown, unknown, unknown, 'MyCustom'>(api, 'MyCustom')).toThrow(
      CustomChainInvalidError
    )
  })
})
