import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api/IPolkadotApi'
import type { TDryRunNodeResult } from '../../types'
import { validateAddress } from '../../utils'
import { dryRunOrigin } from './dryRunOrigin'

vi.mock('../../utils', () => ({
  validateAddress: vi.fn()
}))

describe('getDryRunOrigin', () => {
  const apiMock = {
    init: vi.fn(),
    getDryRunCall: vi.fn(),
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  it('returns the dry run result', async () => {
    const address = '0x123'
    const node = 'Polkadot'

    const mockResult: TDryRunNodeResult = {
      success: true,
      fee: 1000n,
      forwardedXcms: [],
      destParaId: 0,
      currency: 'DOT'
    }

    vi.spyOn(apiMock, 'getDryRunCall').mockResolvedValue(mockResult)

    const initSpy = vi.spyOn(apiMock, 'init')
    const disconnectSpy = vi.spyOn(apiMock, 'disconnect')

    const result = await dryRunOrigin({
      api: apiMock,
      node,
      address,
      tx: {}
    })

    expect(validateAddress).toHaveBeenCalledWith(address, node, false)
    expect(result).toEqual(mockResult)
    expect(initSpy).toHaveBeenCalledWith(node)
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
