import { getParaId } from '@paraspell/sdk-core'
import type { Environment } from '@snowbridge/base-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEnvironment } from './createEnvironment'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  getParaId: vi.fn()
}))

describe('createEnvironment', () => {
  const MOONBEAM_PARA_ID = 2004

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getParaId).mockReturnValue(MOONBEAM_PARA_ID)
  })

  it('preserves the input environment and merges ethereumChains', () => {
    const ethereumChains: Record<string, string> = {
      '1': 'https://eth.llamarpc.com'
    }
    const input = {
      name: 'polkadot_mainnet',
      ethereumChains
    } as Environment

    const result = createEnvironment(input)

    expect(result.name).toBe('polkadot_mainnet')
    expect(result.ethereumChains).toEqual({
      1: 'https://eth.llamarpc.com',
      [MOONBEAM_PARA_ID]: 'https://rpc.api.moonbeam.network'
    })
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

  it('adds the Moonbeam xcmInterface precompile mapping', () => {
    const result = createEnvironment({
      ethereumChains: {}
    } as Environment)

    expect(result.precompiles).toEqual({
      '2004': '0x000000000000000000000000000000000000081A'
    })
  })

  it('uses getParaId to look up the Moonbeam key in ethereumChains', () => {
    createEnvironment({ ethereumChains: {} } as unknown as Environment)

    expect(getParaId).toHaveBeenCalledWith('Moonbeam')
  })
})
