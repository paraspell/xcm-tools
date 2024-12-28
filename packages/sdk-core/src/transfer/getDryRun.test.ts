import { describe, it, expect, vi } from 'vitest'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import { getDryRun } from './getDryRun'
import type { TDryRunResult } from '../types'

describe('getDryRun', () => {
  const apiMock = {
    init: vi.fn(),
    getDryRun: vi.fn(),
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  it('returns the dry run result', async () => {
    const address = '0x123'
    const node = 'Polkadot'

    const mockResult: TDryRunResult = {
      success: true,
      fee: BigInt(1000)
    }

    vi.spyOn(apiMock, 'getDryRun').mockResolvedValue(mockResult)

    const initSpy = vi.spyOn(apiMock, 'init')
    const disconnectSpy = vi.spyOn(apiMock, 'disconnect')

    const result = await getDryRun({
      api: apiMock,
      node,
      address,
      tx: {}
    })

    expect(result).toEqual(mockResult)
    expect(initSpy).toHaveBeenCalledWith(node)
    expect(disconnectSpy).toHaveBeenCalled()
  })

  it('throws an error if the node is Kusama', async () => {
    const address = '0x123'
    const node = 'Kusama'

    await expect(
      getDryRun({
        api: apiMock,
        node,
        address,
        tx: {}
      })
    ).rejects.toThrow('Kusama is temporarily disable due to unknown error in DryRun.')
  })
})
