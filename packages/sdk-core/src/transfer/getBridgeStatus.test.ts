import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { TBridgeStatus } from '../types'
import { getBridgeStatus } from './getBridgeStatus'

describe('getBridgeStatus', () => {
  const apiMock = {
    init: vi.fn(),
    getBridgeStatus: vi.fn(),
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  it('returns the bridge status', async () => {
    const mockResult: TBridgeStatus = 'Normal'

    vi.spyOn(apiMock, 'getBridgeStatus').mockResolvedValue(mockResult)

    const initSpy = vi.spyOn(apiMock, 'init')
    const disconnectSpy = vi.spyOn(apiMock, 'disconnect')

    const result = await getBridgeStatus(apiMock)

    expect(result).toEqual(mockResult)
    expect(initSpy).toHaveBeenCalledWith('BridgeHubPolkadot')
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
