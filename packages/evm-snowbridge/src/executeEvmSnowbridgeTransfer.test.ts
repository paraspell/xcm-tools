import type { PolkadotApi } from '@paraspell/sdk-core'
import {
  getEvmSnowbridgeExtensionOrThrow,
  registerEvmSnowbridgeExtension,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import type { WalletClient } from 'viem'
import { describe, expect, it } from 'vitest'

describe('@paraspell/evm-snowbridge', () => {
  it('registers the extension on import', async () => {
    await import('./index')

    const ext = getEvmSnowbridgeExtensionOrThrow()
    expect(typeof ext.executeEvmSnowbridgeTransfer).toBe('function')
  })

  it('rejects multi-asset currency with UnsupportedOperationError', async () => {
    await import('./index')
    const { executeEvmSnowbridgeTransfer } = await import('./executeEvmSnowbridgeTransfer')

    await expect(
      executeEvmSnowbridgeTransfer({
        api: {} as PolkadotApi<unknown, unknown, unknown>,
        from: 'Ethereum',
        to: 'AssetHubPolkadot',
        currency: [],
        recipient: '0x0',
        signer: {} as WalletClient
      })
    ).rejects.toThrow(UnsupportedOperationError)
  })

  it('leaves the registry populated for the whole session (no teardown)', () => {
    expect(() => getEvmSnowbridgeExtensionOrThrow()).not.toThrow()
    // Reset for tests in other files that may assume a clean slate.
    registerEvmSnowbridgeExtension(undefined)
  })
})
