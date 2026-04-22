import { describe, expect, it } from 'vitest'

import { ExtensionNotInstalledError } from '../errors'
import type { TEvmTransferOptions } from '../types'
import { getEvmExtensionOrThrow, registerEvmExtension } from './evmRegistry'

describe('evmRegistry', () => {
  it('throws ExtensionNotInstalledError when nothing is registered', () => {
    // Reset the registry.
    registerEvmExtension(undefined)

    expect(() => getEvmExtensionOrThrow()).toThrow(ExtensionNotInstalledError)
    expect(() => getEvmExtensionOrThrow()).toThrow(
      'The EVM extension is not registered. Please install @paraspell/evm and import it before using an EVM origin.'
    )
  })

  it('returns the registered extension', () => {
    const executeEvmTransfer = (_: TEvmTransferOptions<unknown, unknown, unknown>) =>
      Promise.resolve('0xdeadbeef')
    registerEvmExtension({ executeEvmTransfer })

    expect(getEvmExtensionOrThrow().executeEvmTransfer).toBe(executeEvmTransfer)

    // Reset for isolation.
    registerEvmExtension(undefined)
  })
})
