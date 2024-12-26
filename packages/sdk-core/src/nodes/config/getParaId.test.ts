import { describe, it, expect, vi } from 'vitest'
import { getParaId } from './getParaId'
import { getNodeConfig } from './getNodeConfig'
import type { TNodeConfig, TNodeDotKsmWithRelayChains } from '../../types'

vi.mock('./getNodeConfig', () => ({
  getNodeConfig: vi.fn()
}))

describe('getParaId', () => {
  it('should return the correct paraId for a valid node', () => {
    const mockNode: TNodeDotKsmWithRelayChains = 'Acala'
    const mockConfig = { paraId: 2000 } as TNodeConfig
    vi.mocked(getNodeConfig).mockReturnValue(mockConfig)

    const result = getParaId(mockNode)
    expect(result).toBe(2000)
    expect(getNodeConfig).toHaveBeenCalledWith(mockNode)
  })

  it('should throw an error when the node is invalid', () => {
    const mockNode = 'InvalidNode' as TNodeDotKsmWithRelayChains

    vi.mocked(getNodeConfig).mockImplementation(() => {
      throw new Error(`Node configuration not found for ${mockNode}`)
    })

    expect(() => getParaId(mockNode)).toThrowError(`Node configuration not found for ${mockNode}`)
    expect(getNodeConfig).toHaveBeenCalledWith(mockNode)
  })

  it('should return the correct paraId for another valid node', () => {
    const mockNode: TNodeDotKsmWithRelayChains = 'Amplitude'
    const mockConfig = { paraId: 2015 } as TNodeConfig
    vi.mocked(getNodeConfig).mockReturnValue(mockConfig)

    const result = getParaId(mockNode)
    expect(result).toBe(2015)
    expect(getNodeConfig).toHaveBeenCalledWith(mockNode)
  })

  it('should handle nodes with a paraId of 0', () => {
    const mockNode: TNodeDotKsmWithRelayChains = 'Polkadot'
    const mockConfig = { paraId: 0 } as TNodeConfig
    vi.mocked(getNodeConfig).mockReturnValue(mockConfig)

    const result = getParaId(mockNode)
    expect(result).toBe(0)
    expect(getNodeConfig).toHaveBeenCalledWith(mockNode)
  })
})
