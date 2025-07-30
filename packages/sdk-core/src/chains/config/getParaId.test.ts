import type { TChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { TChainConfig } from '../../types'
import { getChainConfig } from './getChainConfig'
import { getParaId } from './getParaId'

vi.mock('./getChainConfig', () => ({
  getChainConfig: vi.fn()
}))

describe('getParaId', () => {
  it('should return the correct paraId for a valid chain', () => {
    const mockChain: TChain = 'Acala'
    const mockConfig = { paraId: 2000 } as TChainConfig
    vi.mocked(getChainConfig).mockReturnValue(mockConfig)

    const result = getParaId(mockChain)
    expect(result).toBe(2000)
    expect(getChainConfig).toHaveBeenCalledWith(mockChain)
  })

  it('should return the correct paraId for another valid chain', () => {
    const mockChain: TChain = 'Amplitude'
    const mockConfig = { paraId: 2015 } as TChainConfig
    vi.mocked(getChainConfig).mockReturnValue(mockConfig)

    const result = getParaId(mockChain)
    expect(result).toBe(2015)
    expect(getChainConfig).toHaveBeenCalledWith(mockChain)
  })

  it('should handle chains with a paraId of 0', () => {
    const mockChains: TChain = 'Polkadot'
    const mockConfig = { paraId: 0 } as TChainConfig
    vi.mocked(getChainConfig).mockReturnValue(mockConfig)

    const result = getParaId(mockChains)
    expect(result).toBe(0)
    expect(getChainConfig).toHaveBeenCalledWith(mockChains)
  })

  it('should handle Ethereum with a paraId of 1', () => {
    const result = getParaId('Ethereum')
    expect(result).toBe(1)
  })
})
