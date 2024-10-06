import { describe, it, expect, vi } from 'vitest'
import { createApiInstance } from './createApiInstance'
import { ApiPromise, WsProvider } from '@polkadot/api'

vi.mock('@polkadot/api', () => ({
  WsProvider: vi.fn(),
  ApiPromise: {
    create: vi.fn()
  }
}))

describe('createApiInstance', () => {
  it('should create an API instance with the provided WebSocket URL', async () => {
    const wsUrl = 'wss://example.com'
    const apiInstanceMock = {}
    const wsProviderMock = {}

    const mockedWsProvider = vi.mocked(WsProvider)
    const mockedApiPromiseCreateSpy = vi
      .spyOn(ApiPromise, 'create')
      .mockResolvedValue(apiInstanceMock as ApiPromise)

    mockedWsProvider.mockImplementation(() => wsProviderMock as unknown as WsProvider)

    const result = await createApiInstance(wsUrl)

    expect(mockedWsProvider).toHaveBeenCalledWith(wsUrl)
    expect(mockedApiPromiseCreateSpy).toHaveBeenCalledWith({ provider: wsProviderMock })
    expect(result).toBe(apiInstanceMock)
  })

  it('should throw an error if ApiPromise.create fails', async () => {
    const wsUrl = 'wss://example.com'

    const mockedWsProvider = vi.mocked(WsProvider)
    vi.spyOn(ApiPromise, 'create').mockRejectedValue(new Error('Failed to create API'))

    mockedWsProvider.mockImplementation(() => ({}) as WsProvider)

    await expect(createApiInstance(wsUrl)).rejects.toThrow('Failed to create API')
  })
})
