import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotJsApi from './PolkadotJsApi'

const apiMocks = vi.hoisted(() => ({
  createMock: vi.fn(),
  propertiesMock: vi.fn().mockResolvedValue(undefined),
  disconnectMock: vi.fn().mockResolvedValue(undefined)
}))

apiMocks.createMock.mockResolvedValue({
  rpc: {
    system: {
      properties: apiMocks.propertiesMock
    }
  },
  disconnect: apiMocks.disconnectMock
})

vi.mock('@polkadot/api', () => {
  return {
    ApiPromise: {
      create: apiMocks.createMock
    },
    WsProvider: class WsProvider {
      constructor(_endpoint: unknown) {}
    }
  }
})

describe('PolkadotJsApi client pool hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    apiMocks.propertiesMock.mockClear()
    apiMocks.disconnectMock.mockClear()
    apiMocks.createMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pings via rpc.system.properties on TTL expiry and disconnects on eviction', async () => {
    const api = new PolkadotJsApi('wss://test')

    await api.init('Acala', 10)

    expect(apiMocks.createMock).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(11)
    await Promise.resolve()
    await Promise.resolve()
    expect(apiMocks.propertiesMock).toHaveBeenCalledTimes(1)

    await api.disconnect(false)
    expect(apiMocks.disconnectMock).toHaveBeenCalledTimes(1)
  })
})
