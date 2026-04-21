import {
  getEvmExtensionOrThrow,
  registerEvmExtension,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import { describe, expect, it } from 'vitest'

describe('@paraspell/evm', () => {
  it('registers the extension on import', async () => {
    await import('./index')

    const ext = getEvmExtensionOrThrow()
    expect(typeof ext.executeEvmTransfer).toBe('function')
  })

  it("stub executor throws UnsupportedOperationError pointing at the follow-up", async () => {
    await import('./index')
    const { executeEvmTransfer } = await import('./executeEvmTransfer')

    await expect(executeEvmTransfer({} as never)).rejects.toThrow(UnsupportedOperationError)
    await expect(executeEvmTransfer({} as never)).rejects.toThrow(
      /not yet implemented/i
    )
  })

  it('leaves the registry populated for the whole session (no teardown)', () => {
    expect(() => getEvmExtensionOrThrow()).not.toThrow()
    // Reset for tests in other files that may assume a clean slate.
    registerEvmExtension(undefined as never)
  })
})
