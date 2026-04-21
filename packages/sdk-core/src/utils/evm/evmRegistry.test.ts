import { describe, expect, it } from 'vitest'

import { ExtensionNotInstalledError } from '../../errors'
import type { TEvmBuilderOptions } from '../../types'
import { getEvmExtensionOrThrow, registerEvmExtension, type TEvmExtension } from './evmRegistry'

describe('evmRegistry', () => {
  it('throws ExtensionNotInstalledError when nothing is registered', () => {
    // Reset the registry.
    registerEvmExtension(undefined as unknown as TEvmExtension)

    expect(() => getEvmExtensionOrThrow()).toThrow(ExtensionNotInstalledError)
    expect(() => getEvmExtensionOrThrow()).toThrow(
      'The EVM extension is not registered. Please install @paraspell/evm and import it before using Ethereum as an origin.'
    )
  })

  it('returns the registered extension', () => {
    const executeEvmTransfer = (_: TEvmBuilderOptions<unknown, unknown, unknown>) =>
      Promise.resolve('0xdeadbeef')
    registerEvmExtension({ executeEvmTransfer })

    expect(getEvmExtensionOrThrow().executeEvmTransfer).toBe(executeEvmTransfer)

    // Reset for isolation.
    registerEvmExtension(undefined as unknown as TEvmExtension)
  })
})
