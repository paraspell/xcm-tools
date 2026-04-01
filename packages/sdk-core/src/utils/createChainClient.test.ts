import { describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api/PolkadotApi'
import { createChainClient } from './createChainClient'

const mockApiInstance = {}

const createMockApi = () => {
  const initMock = vi.fn().mockResolvedValue(undefined)

  const api = {
    init: initMock,
    api: mockApiInstance
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  return { api, initMock, apiMock: mockApiInstance }
}

describe('createChainClient', () => {
  it('initializes the provided api and returns the underlying instance', async () => {
    const { api, initMock } = createMockApi()

    const result = await createChainClient(api, 'Polkadot')

    expect(initMock).toHaveBeenCalledWith('Polkadot')
    expect(result).toBe(mockApiInstance)
  })

  it('returns the api after awaiting initialization for another chain', async () => {
    const { api, initMock } = createMockApi()

    const result = await createChainClient(api, 'Moonbeam')

    expect(initMock).toHaveBeenCalledWith('Moonbeam')
    expect(result).toBe(mockApiInstance)
  })
})
