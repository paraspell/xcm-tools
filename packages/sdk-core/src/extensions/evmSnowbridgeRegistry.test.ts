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
    const executeTransfer = <TApi, TRes, TSigner, TCustomChain extends string = never>(
      _: TEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>
    ) => Promise.resolve('0xdeadbeef')
    const buildTransfer = () => Promise.resolve({ type: 'eip1559', chainId: 1 } as const)
    registerEvmSnowbridgeExtension({ executeTransfer, buildTransfer })

    expect(getEvmSnowbridgeExtensionOrThrow().executeTransfer).toBe(executeTransfer)
    expect(getEvmSnowbridgeExtensionOrThrow().buildTransfer).toBe(buildTransfer)

    // Reset for isolation.
    registerEvmSnowbridgeExtension(undefined)
  })
})
