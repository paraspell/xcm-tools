import { describe, it, expect, vi } from 'vitest'
import { generateMessageId } from './generateMessageId'
import type { IPolkadotApi } from '../../api'

describe('generateMessageId', () => {
  it('should generate the correct message id', async () => {
    const fakeSenderAddress = 'Alice'
    const fakeSourceParaId = 42
    const fakeTokenAddress = '0xToken'
    const fakeRecipientAddress = 'Bob'
    const fakeAmount = 100
    const fakeAccountNextId = '10'

    const stringToUint8a = (str: string) => new TextEncoder().encode(str)
    const hexToUint8a = (hex: string) => {
      const normalizedHex = hex.startsWith('0x') ? hex.slice(2) : hex
      const result = new Uint8Array(normalizedHex.length / 2)
      for (let i = 0; i < normalizedHex.length; i += 2) {
        result[i / 2] = parseInt(normalizedHex.substring(i, i + 2), 16)
      }
      return result
    }
    const accountToHex = vi.fn((address: string) => {
      return '0x' + Buffer.from(address).toString('hex')
    })
    const blake2AsHex = vi.fn(() => '0xfakehash')

    const api = {
      getFromRpc: vi.fn().mockResolvedValue(fakeAccountNextId),
      accountToHex,
      stringToUint8a,
      hexToUint8a,
      blake2AsHex
    } as unknown as IPolkadotApi<unknown, unknown>

    const getFromRpcSpy = vi.spyOn(api, 'getFromRpc')
    const accountToHexSpy = vi.spyOn(api, 'accountToHex')
    const blake2AsHexSpy = vi.spyOn(api, 'blake2AsHex')

    const result = await generateMessageId(
      api,
      fakeSenderAddress,
      fakeSourceParaId,
      fakeTokenAddress,
      fakeRecipientAddress,
      fakeAmount
    )

    const expectedEntropy = new Uint8Array([
      ...stringToUint8a(fakeSourceParaId.toString()),
      ...hexToUint8a(accountToHex(fakeSenderAddress)),
      ...stringToUint8a(fakeAccountNextId),
      ...hexToUint8a(fakeTokenAddress),
      ...stringToUint8a(fakeRecipientAddress),
      ...stringToUint8a(fakeAmount.toString())
    ])

    expect(getFromRpcSpy).toHaveBeenCalledWith('system', 'accountNextIndex', fakeSenderAddress)
    expect(accountToHexSpy).toHaveBeenCalledWith(fakeSenderAddress)
    expect(blake2AsHexSpy).toHaveBeenCalledWith(expectedEntropy)
    expect(result).toBe('0xfakehash')
  })
})
