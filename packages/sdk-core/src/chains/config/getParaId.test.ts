import type { TChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { ETH_MAINNET_PARA_ID, ETH_TESTNET_PARA_ID } from '../../constants'
import type { TChainConfig } from '../../types'
import { getChainConfig } from './getChainConfig'
import { getParaId } from './getParaId'

vi.mock('./getChainConfig')

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

  it('should return Ethereum paraId', () => {
    const result = getParaId('Ethereum')
    expect(result).toBe(ETH_MAINNET_PARA_ID)
  })

  it('should return Ethereum testnet paraId', () => {
    const result = getParaId('EthereumTestnet')
    expect(result).toBe(ETH_TESTNET_PARA_ID)
  })
})
