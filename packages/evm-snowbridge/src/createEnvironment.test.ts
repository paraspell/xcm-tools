import type { Environment } from '@snowbridge/base-types'
import { describe, expect, it } from 'vitest'

import { createEnvironment } from './createEnvironment'

describe('createEnvironment', () => {
  it('preserves the input environment', () => {
    const ethereumChains: Record<string, string> = {
      '1': 'https://eth.llamarpc.com'
    }
    const input = {
      name: 'polkadot_mainnet',
      ethereumChains
    } as Environment

    const result = createEnvironment(input)

    expect(result.name).toBe('polkadot_mainnet')
    expect(result.ethereumChains).toEqual(ethereumChains)
  })

  it('adds the Mythos asset override for parachain 3369', () => {
    const result = createEnvironment({
      ethereumChains: {}
    } as Environment)

    expect(result.assetOverrides).toEqual({
      '3369': [
        expect.objectContaining({
          token: '0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003',
          symbol: 'MYTH',
          decimals: 18,
          minimumBalance: 10_000_000_000_000_000n,
          isSufficient: true
        })
      ]
    })
  })
})
