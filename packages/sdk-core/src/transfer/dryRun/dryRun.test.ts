import type { TCurrencyInputWithAmount } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api/IPolkadotApi'
import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TDryRunResult } from '../../types'
import { validateAddress } from '../../utils'
import { dryRun } from './dryRun'
import { dryRunInternal } from './dryRunInternal'

vi.mock('../../utils', () => ({
  validateAddress: vi.fn()
}))

vi.mock('./dryRunInternal', () => ({
  dryRunInternal: vi.fn()
}))

describe('dryRun', () => {
  const apiMock = {
    init: vi.fn(),
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  it('returns the dry run result', async () => {
    const address = '0x123'
    const node = 'Polkadot'

    const mockResult: TDryRunResult = {
      origin: {
        success: true,
        fee: 1000n,
        forwardedXcms: [],
        destParaId: 0,
        currency: 'DOT'
      }
    }

    vi.mocked(dryRunInternal).mockResolvedValue(mockResult)

    const initSpy = vi.spyOn(apiMock, 'init')
    const disconnectSpy = vi.spyOn(apiMock, 'disconnect')

    const result = await dryRun({
      api: apiMock,
      origin: node,
      destination: node,
      senderAddress: address,
      currency: {} as TCurrencyInputWithAmount,
      address,
      tx: {}
    })

    expect(validateAddress).toHaveBeenCalledWith(address, node, false)
    expect(result).toEqual(mockResult)
    expect(initSpy).toHaveBeenCalledWith(node, DRY_RUN_CLIENT_TIMEOUT_MS)
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
