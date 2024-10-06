import { describe, it, expect, vi } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import { createAccID } from './createAccID'

describe('createAccID', () => {
  it('should create AccountId32 hex string', () => {
    const account = '5D4e8x...'
    const hexString = '0x1234567890abcdef'

    const api = {
      createType: vi.fn().mockReturnValue({
        toHex: vi.fn().mockReturnValue(hexString)
      })
    } as unknown as ApiPromise

    const consoleLogSpy = vi.spyOn(console, 'log')
    const createTypeSpy = vi.spyOn(api, 'createType')

    const result = createAccID(api, account)

    expect(consoleLogSpy).toHaveBeenCalledWith('Generating AccountId32 address')
    expect(createTypeSpy).toHaveBeenCalledWith('AccountId32', account)
    expect(result).toBe(hexString)

    consoleLogSpy.mockRestore()
  })
})
