import type { PolkadotApi } from '@paraspell/sdk-core'
import {
  getEvmExtensionOrThrow,
  registerEvmExtension,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import type { WalletClient } from 'viem'
import { describe, expect, it } from 'vitest'

describe('@paraspell/evm', () => {
  it('registers the extension on import', async () => {
    await import('./index')

    const ext = getEvmExtensionOrThrow()
    expect(typeof ext.executeEvmTransfer).toBe('function')
  })

  it('throws UnsupportedOperationError for unsupported (from, to) pairs', async () => {
    await import('./index')
    const { executeEvmTransfer } = await import('./executeEvmTransfer')

    await expect(
      executeEvmTransfer({
        api: {
          init: () => Promise.resolve(),
          clone: () => ({})
        } as unknown as PolkadotApi<unknown, unknown, unknown>,
        from: 'Acala',
        to: 'AssetHubPolkadot',
        currency: { symbol: 'ACA', amount: '1' },
        recipient: '0x0',
        signer: {
          account: { address: '0x0' },
          chain: {}
        } as unknown as WalletClient
      })
    ).rejects.toThrow(UnsupportedOperationError)
  })

  it('leaves the registry populated for the whole session (no teardown)', () => {
    expect(() => getEvmExtensionOrThrow()).not.toThrow()
    // Reset for tests in other files that may assume a clean slate.
    registerEvmExtension(undefined)
  })
})
