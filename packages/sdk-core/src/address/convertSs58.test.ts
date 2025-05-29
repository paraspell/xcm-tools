import { getAssetsObject, isNodeEvm } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { base58 } from '@scure/base'
import { isAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import { blake2b256, blake2b512, convertSs58, deriveAccountId, encodeSs58 } from './convertSs58'

vi.mock('viem', () => ({
  isAddress: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  getAssetsObject: vi.fn(() => ({ ss58Prefix: 2 })),
  isNodeEvm: vi.fn()
}))

const makeSeq = (len: number, start = 0) =>
  Uint8Array.from({ length: len }, (_, i) => (start + i) & 0xff)

const SS58PRE = new TextEncoder().encode('SS58PRE')

describe('crypto helpers', () => {
  it('blake2b* produce correct digest lengths', () => {
    const msg = makeSeq(10)
    expect(blake2b256(msg)).toHaveLength(32)
    expect(blake2b512(msg)).toHaveLength(64)
  })

  describe('deriveAccountId', () => {
    const pk32 = makeSeq(32)
    const pk33 = makeSeq(33, 1)

    it('returns the same bytes for 32-byte keys', () => {
      expect(deriveAccountId(pk32)).toEqual(pk32)
    })

    it('hashes 33-byte keys', () => {
      expect(deriveAccountId(pk33)).toEqual(blake2b256(pk33))
    })

    it('throws for any other length', () => {
      expect(() => deriveAccountId(makeSeq(31))).toThrow()
      expect(() => deriveAccountId(makeSeq(34))).toThrow()
    })
  })

  describe('encodeSs58', () => {
    const payload = makeSeq(32)
    const network = 42

    it('encodes a payload into a valid base58 string', () => {
      const addr = encodeSs58(payload, network)
      const decoded = base58.decode(addr)

      // 1. network byte(s)
      expect(decoded[0]).toBe(network)

      // 2. payload
      expect(decoded.slice(1, 33)).toEqual(payload)

      // 3. checksum
      const chkInput = new Uint8Array(SS58PRE.length + 1 + payload.length)
      chkInput.set(SS58PRE)
      chkInput.set(Uint8Array.of(network), SS58PRE.length)
      chkInput.set(payload, SS58PRE.length + 1)

      const expectedChecksum = blake2b512(chkInput).subarray(0, 2)
      expect(decoded.slice(-2)).toEqual(expectedChecksum)
    })

    it('rejects payloads that are not 32/33 bytes long', () => {
      expect(() => encodeSs58(makeSeq(31), network)).toThrow()
    })
  })

  describe('convertSs58', () => {
    const evmAddr = '0x0123456789abcdef0123456789ABCDEF01234567'
    const ss58Addr = '5D4zMwP97r...' // dummy; never parsed by mocks

    const pubkey = makeSeq(32)
    const node = 'NODE' as TNodeDotKsmWithRelayChains

    let apiMock: IPolkadotApi<unknown, unknown>

    beforeEach(() => {
      vi.resetAllMocks()

      apiMock = {
        accountToUint8a: vi.fn(() => pubkey)
      } as unknown as IPolkadotApi<unknown, unknown>
    })

    it('EVM address on EVM node - returns the address untouched', () => {
      vi.mocked(isAddress).mockReturnValue(true)
      vi.mocked(isNodeEvm).mockReturnValue(true)

      const spy = vi.spyOn(apiMock, 'accountToUint8a')

      const res = convertSs58(apiMock, evmAddr, node)
      expect(res).toBe(evmAddr)

      expect(spy).not.toHaveBeenCalled()
      expect(getAssetsObject).not.toHaveBeenCalled()
    })

    it('EVM address on NON-EVM node - throws InvalidParameterError', () => {
      vi.mocked(isAddress).mockReturnValue(true)
      vi.mocked(isNodeEvm).mockReturnValue(false)

      const spy = vi.spyOn(apiMock, 'accountToUint8a')

      expect(() => convertSs58(apiMock, evmAddr, node)).toThrow(
        'Cannot convert EVM address to SS58.'
      )
      expect(spy).not.toHaveBeenCalled()
    })

    it('SS58 address on EVM node - throws InvalidParameterError', () => {
      vi.mocked(isAddress).mockReturnValue(false)
      vi.mocked(isNodeEvm).mockReturnValue(true)

      const spy = vi.spyOn(apiMock, 'accountToUint8a')

      expect(() => convertSs58(apiMock, ss58Addr, node)).toThrow(
        'Cannot convert SS58 address to EVM.'
      )
      expect(spy).not.toHaveBeenCalled()
    })

    it('SS58 address on NON-EVM node - performs a normal conversion', () => {
      vi.mocked(isAddress).mockReturnValue(false)
      vi.mocked(isNodeEvm).mockReturnValue(false)

      const spy = vi.spyOn(apiMock, 'accountToUint8a')

      const res = convertSs58(apiMock, ss58Addr, node)

      expect(spy).toHaveBeenCalledWith(ss58Addr)
      expect(getAssetsObject).toHaveBeenCalledWith(node)

      const expected = encodeSs58(deriveAccountId(pubkey), 2)
      expect(res).toBe(expected)
    })
  })
})
