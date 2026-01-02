import { describe, expect, it } from 'vitest'

import { getEvmPrivateKeyHex } from './getEvmPrivateKey'

describe('getEvmPrivateKeyHex', () => {
  it('should return the private key for a known EVM dev account', () => {
    const privateKey = getEvmPrivateKeyHex('//Alith')
    expect(privateKey).toBe('0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133')
  })

  it('should return undefined for non-EVM paths', () => {
    const privateKey = getEvmPrivateKeyHex('//Alice')
    expect(privateKey).toBeUndefined()
  })
})
