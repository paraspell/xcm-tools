import { describe, expect, it } from 'vitest'

import { ExtensionNotInstalledError } from '../errors'
import type { TEvmTransferOptions } from '../types'
import {
  getEvmSnowbridgeExtensionOrThrow,
  registerEvmSnowbridgeExtension
} from './evmSnowbridgeRegistry'

describe('evmSnowbridgeRegistry', () => {
  it('throws ExtensionNotInstalledError when nothing is registered', () => {
    // Reset the registry.
    registerEvmSnowbridgeExtension(undefined)

    expect(() => getEvmSnowbridgeExtensionOrThrow()).toThrow(ExtensionNotInstalledError)
    expect(() => getEvmSnowbridgeExtensionOrThrow()).toThrow(
      'The EVM Snowbridge extension is not registered. Please install @paraspell/evm-snowbridge and import it before using Ethereum as an origin.'
    )
  })

  it('returns the registered extension', () => {
    const executeEvmSnowbridgeTransfer = (_: TEvmTransferOptions<unknown, unknown, unknown>) =>
      Promise.resolve('0xdeadbeef')
    registerEvmSnowbridgeExtension({ executeEvmSnowbridgeTransfer })

    expect(getEvmSnowbridgeExtensionOrThrow().executeEvmSnowbridgeTransfer).toBe(
      executeEvmSnowbridgeTransfer
    )

    // Reset for isolation.
    registerEvmSnowbridgeExtension(undefined)
  })
})
