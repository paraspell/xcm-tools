import { describe, it, expect, vi } from 'vitest'
import type { TNodePolkadotKusama } from '../types'
import { getNodeEndpointOption } from '../utils'
import type { EndpointOption } from '@polkadot/apps-config/endpoints/types'
import { getAllNodeProviders } from './getAllNodeProviders'

vi.mock('../utils', () => ({
  getNodeEndpointOption: vi.fn()
}))

describe('getAllNodeProviders', () => {
  it('should return an array of providers when providers are available', () => {
    const node = 'polkadot' as TNodePolkadotKusama
    const providersMock = { Provider1: 'https://provider1.com', Provider2: 'https://provider2.com' }

    vi.mocked(getNodeEndpointOption).mockReturnValue({
      providers: providersMock
    } as unknown as EndpointOption)

    const result = getAllNodeProviders(node)

    expect(result).toEqual(['https://provider1.com', 'https://provider2.com'])
    expect(getNodeEndpointOption).toHaveBeenCalledWith(node)
  })

  it('should throw an error if the node does not have any providers', () => {
    const node = 'kusama' as TNodePolkadotKusama

    vi.mocked(getNodeEndpointOption).mockReturnValue({ providers: {} } as unknown as EndpointOption)

    expect(() => getAllNodeProviders(node)).toThrowError(
      `Node ${node} does not have any providers.`
    )
    expect(getNodeEndpointOption).toHaveBeenCalledWith(node)
  })

  it('should return an empty array if providers are not available', () => {
    const node = 'polkadot' as TNodePolkadotKusama

    vi.mocked(getNodeEndpointOption).mockReturnValue(undefined)

    const result = getAllNodeProviders(node)

    expect(result).toEqual([])
    expect(getNodeEndpointOption).toHaveBeenCalledWith(node)
  })
})
