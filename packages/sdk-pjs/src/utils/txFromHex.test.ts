/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnsupportedOperationError } from '@paraspell/sdk-core'
import { compactToU8a, u8aConcat, u8aEq } from '@polkadot/util'
import { describe, expect, it, vi } from 'vitest'

import type { Extrinsic, TPjsApi } from '../types'
import { txFromHex } from './txFromHex'

vi.mock('@polkadot/util', () => ({
  compactToU8a: vi.fn(),
  u8aConcat: vi.fn(),
  u8aEq: vi.fn()
}))

const createTxMock = (
  pallets: Record<string, Record<string, ReturnType<typeof vi.fn>>>,
  impl?: (...args: any[]) => any
) => {
  const txFn = impl ? vi.fn().mockImplementation(impl) : vi.fn()
  Object.assign(txFn, pallets)
  return txFn
}

describe('txFromHex', () => {
  it('should decode a valid full extrinsic', () => {
    const hex = '0xdeadbeef'
    const mockTx = { toHex: () => hex } as unknown as Extrinsic
    const api = { tx: vi.fn().mockReturnValue(mockTx) } as unknown as TPjsApi

    const result = txFromHex(api, hex)

    expect(result).toBe(mockTx)
  })

  it('should fall back to Call decoding when extrinsic decode fails', () => {
    const hex = '0xcallhex'
    const mockExtrinsic = 'rebuilt_extrinsic' as unknown as Extrinsic
    const transferSpy = vi.fn().mockReturnValue(mockExtrinsic)
    const findMetaCallSpy = vi.fn().mockReturnValue({ method: 'transfer', section: 'balances' })
    const throwNotExtrinsic = () => {
      throw new Error('not an extrinsic')
    }
    const txMock = createTxMock({ balances: { transfer: transferSpy } }, throwNotExtrinsic)
    const api = {
      tx: txMock,
      createType: vi.fn().mockReturnValue({
        toHex: vi.fn().mockReturnValue(hex),
        callIndex: new Uint8Array([0, 1]),
        args: ['arg1', 'arg2']
      }),
      registry: {
        findMetaCall: findMetaCallSpy
      }
    } as unknown as TPjsApi

    const result = txFromHex(api, hex)

    expect(result).toBe(mockExtrinsic)
    expect(findMetaCallSpy).toHaveBeenCalledWith(new Uint8Array([0, 1]))
    expect(transferSpy).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should fall back to prefixed ExtrinsicPayload when Call and extrinsic fail', () => {
    const hex = '0xpayloadhex'
    const mockExtrinsic = 'payload_extrinsic' as unknown as Extrinsic
    const remarkSpy = vi.fn().mockReturnValue(mockExtrinsic)

    let callCount = 0
    const throwNotExtrinsic = () => {
      throw new Error('not an extrinsic')
    }
    const api = {
      tx: createTxMock({ system: { remark: remarkSpy } }, throwNotExtrinsic),
      createType: vi.fn().mockImplementation((typeName: string) => {
        if (typeName === 'Call') {
          callCount++
          if (callCount === 1) throw new Error('not a call')
          return { callIndex: new Uint8Array([0, 0]), args: ['remarkData'] }
        }
        return {
          toHex: vi.fn().mockReturnValue(hex),
          method: { toHex: vi.fn().mockReturnValue('0xmethodhex') }
        }
      }),
      registry: {
        findMetaCall: vi.fn().mockReturnValue({ method: 'remark', section: 'system' })
      }
    } as unknown as TPjsApi

    const result = txFromHex(api, hex)

    expect(result).toBe(mockExtrinsic)
    expect(remarkSpy).toHaveBeenCalledWith('remarkData')
  })

  it('should throw UnsupportedOperationError when all decode attempts fail', () => {
    const throwNotExtrinsic = () => {
      throw new Error('not an extrinsic')
    }
    const api = {
      tx: createTxMock({}, throwNotExtrinsic),
      createType: vi.fn().mockImplementation((typeName: string) => {
        if (typeName === 'Call') throw new Error('not a call')
        return { toHex: vi.fn().mockReturnValue('0xdifferent') }
      }),
      registry: {}
    } as unknown as TPjsApi

    expect(() => txFromHex(api, '0xgarbage')).toThrow(UnsupportedOperationError)
  })

  it('should decode as un-prefixed ExtrinsicPayload when hex starts with call hex', () => {
    const hex = '0xabcdef'
    const callHex = '0xab'
    const prefixed = new Uint8Array([1, 2, 3])
    const mockExtrinsic = 'unprefixed_payload_extrinsic' as unknown as Extrinsic
    const transferSpy = vi.fn().mockReturnValue(mockExtrinsic)
    const throwNotExtrinsic = () => {
      throw new Error('not an extrinsic')
    }

    vi.mocked(compactToU8a).mockReturnValue(new Uint8Array([4]))
    vi.mocked(u8aConcat).mockReturnValue(prefixed)
    vi.mocked(u8aEq).mockReturnValue(true)

    let callCreateIdx = 0
    const api = {
      tx: createTxMock({ balances: { transfer: transferSpy } }, throwNotExtrinsic),
      createType: vi.fn().mockImplementation((typeName: string) => {
        if (typeName === 'Call') {
          callCreateIdx++
          if (callCreateIdx === 1) {
            return {
              toHex: vi.fn().mockReturnValue(callHex),
              encodedLength: 1
            }
          }
          return {
            callIndex: new Uint8Array([0, 1]),
            args: ['arg1', 'arg2']
          }
        }
        if (typeName === 'ExtrinsicPayload') {
          return {
            toU8a: vi.fn().mockReturnValue(prefixed),
            method: { toHex: vi.fn().mockReturnValue('0xmethod') }
          }
        }
      }),
      registry: {
        findMetaCall: vi.fn().mockReturnValue({ method: 'transfer', section: 'balances' })
      }
    } as unknown as TPjsApi

    const result = txFromHex(api, hex)

    expect(result).toBe(mockExtrinsic)
    expect(vi.mocked(compactToU8a)).toHaveBeenCalledWith(1)
    expect(vi.mocked(u8aConcat)).toHaveBeenCalled()
    expect(vi.mocked(u8aEq)).toHaveBeenCalledWith(prefixed, prefixed)
    expect(transferSpy).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should fall through to final payload when un-prefixed ExtrinsicPayload does not match', () => {
    const hex = '0xabcdef'
    const callHex = '0xab'
    const prefixed = new Uint8Array([1, 2, 3])
    const mockExtrinsic = 'final_payload_extrinsic' as unknown as Extrinsic
    const remarkSpy = vi.fn().mockReturnValue(mockExtrinsic)
    const throwNotExtrinsic = () => {
      throw new Error('not an extrinsic')
    }

    vi.mocked(compactToU8a).mockReturnValue(new Uint8Array([4]))
    vi.mocked(u8aConcat).mockReturnValue(prefixed)
    vi.mocked(u8aEq).mockReturnValue(false)

    let callCreateIdx = 0
    let payloadCreateIdx = 0
    const api = {
      tx: createTxMock({ system: { remark: remarkSpy } }, throwNotExtrinsic),
      createType: vi.fn().mockImplementation((typeName: string) => {
        if (typeName === 'Call') {
          callCreateIdx++
          if (callCreateIdx === 1) {
            return {
              toHex: vi.fn().mockReturnValue(callHex),
              encodedLength: 1
            }
          }
          return {
            callIndex: new Uint8Array([0, 0]),
            args: ['remarkData']
          }
        }
        if (typeName === 'ExtrinsicPayload') {
          payloadCreateIdx++
          if (payloadCreateIdx === 1) {
            return {
              toU8a: vi.fn().mockReturnValue(new Uint8Array([9, 9, 9]))
            }
          }
          return {
            toHex: vi.fn().mockReturnValue(hex),
            method: { toHex: vi.fn().mockReturnValue('0xmethodhex') }
          }
        }
      }),
      registry: {
        findMetaCall: vi.fn().mockReturnValue({ method: 'remark', section: 'system' })
      }
    } as unknown as TPjsApi

    const result = txFromHex(api, hex)

    expect(result).toBe(mockExtrinsic)
    expect(vi.mocked(u8aEq)).toHaveBeenCalled()
    expect(remarkSpy).toHaveBeenCalledWith('remarkData')
  })
})
