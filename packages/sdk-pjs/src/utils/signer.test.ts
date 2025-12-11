import { getEvmPrivateKeyHex } from '@paraspell/sdk-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createKeyringPair } from './signer'

vi.mock('@paraspell/sdk-core', async importActual => ({
  ...(await importActual()),
  getEvmPrivateKeyHex: vi.fn()
}))

describe('createKeyringPair', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create an Sr25519 keypair for non-EVM paths', () => {
    vi.mocked(getEvmPrivateKeyHex).mockReturnValue(undefined)

    const pair = createKeyringPair('//Alice')

    expect(getEvmPrivateKeyHex).toHaveBeenCalledWith('//Alice')
    expect(pair.type).toBe('sr25519')
    expect(pair.address).toBe('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
  })

  it('should create an Ethereum keypair for EVM paths', () => {
    vi.mocked(getEvmPrivateKeyHex).mockReturnValue(
      '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
    )

    const pair = createKeyringPair('//Alith')

    expect(getEvmPrivateKeyHex).toHaveBeenCalledWith('//Alith')
    expect(pair.type).toBe('ethereum')
    expect(pair.address.toLowerCase()).toBeTypeOf('string')
    expect(pair.address.startsWith('0x')).toBe(true)
  })
})
