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
    const executeTransfer = <TApi, TRes, TSigner, TCustomChain extends string = never>(
      _: TEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>
    ) => Promise.resolve('0xdeadbeef')
    const buildTransfer = () => Promise.resolve({ type: 'eip1559', chainId: 1284 } as const)
    registerEvmExtension({ executeTransfer, buildTransfer })

    expect(getEvmExtensionOrThrow().executeTransfer).toBe(executeTransfer)
    expect(getEvmExtensionOrThrow().buildTransfer).toBe(buildTransfer)

    // Reset for isolation.
    registerEvmExtension(undefined)
  })
})
