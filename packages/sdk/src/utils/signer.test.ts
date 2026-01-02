import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { getEvmPrivateKeyHex } from '@paraspell/sdk-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createDevSigner,
  createEcdsaSigner,
  createSr25519Signer,
  deriveAddress,
  resolveEcdsaAddress,
  signEcdsa
} from './signer'

vi.mock('@paraspell/sdk-core', async importActual => ({
  ...(await importActual()),
  getEvmPrivateKeyHex: vi.fn()
}))

describe('signer utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signEcdsa', () => {
    it('should sign input with ECDSA and return signature with recovery byte at end', () => {
      const privateKey = hexToBytes(
        '5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
      )
      const input = new Uint8Array([1, 2, 3, 4, 5])

      const signature = signEcdsa(input, privateKey)

      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBe(65)
    })

    it('should produce valid recoverable signature', () => {
      const privateKey = hexToBytes(
        '5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
      )
      const input = new Uint8Array([1, 2, 3, 4, 5])

      const signature = signEcdsa(input, privateKey)

      // Last byte is recovery id (0-3)
      const recoveryId = signature[64]
      expect(recoveryId).toBeGreaterThanOrEqual(0)
      expect(recoveryId).toBeLessThanOrEqual(3)
    })
  })

  describe('resolveEcdsaAddress', () => {
    it('should derive a 20-byte Ethereum address from private key', () => {
      const privateKey = hexToBytes(
        '5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
      )

      const address = resolveEcdsaAddress(privateKey)

      expect(address).toBeInstanceOf(Uint8Array)
      expect(address.length).toBe(20)
    })

    it('should derive the correct known address for Alith dev account', () => {
      const privateKey = hexToBytes(
        '5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
      )

      const address = resolveEcdsaAddress(privateKey)
      const hexAddress = `0x${bytesToHex(address)}`

      expect(hexAddress.toLowerCase()).toBe('0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac')
    })
  })

  describe('createEcdsaSigner', () => {
    it('should create a signer with Ecdsa type', () => {
      const privateKey = hexToBytes(
        '5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
      )

      const signer = createEcdsaSigner(privateKey)

      expect(signer).toBeDefined()
      expect(signer.publicKey).toBeInstanceOf(Uint8Array)
      expect(signer.publicKey.length).toBe(20)
    })

    it('should create a signer with the correct public key derived from private key', () => {
      const privateKey = hexToBytes(
        '5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
      )

      const signer = createEcdsaSigner(privateKey)

      const expectedAddress = resolveEcdsaAddress(privateKey)
      expect(signer.publicKey).toEqual(expectedAddress)
    })
  })

  describe('createSr25519Signer', () => {
    it('should create a signer for Sr25519', () => {
      const signer = createSr25519Signer('//Alice')
      expect(signer).toBeDefined()
      expect(signer.publicKey).toBeInstanceOf(Uint8Array)
      expect(signer.publicKey.length).toBe(32)
    })

    it('should create a consistent signer for the same path', () => {
      const signer1 = createSr25519Signer('//Bob')
      const signer2 = createSr25519Signer('//Bob')
      expect(signer1.publicKey).toEqual(signer2.publicKey)
    })

    it('should create different signers for different paths', () => {
      const signerAlice = createSr25519Signer('//Alice')
      const signerBob = createSr25519Signer('//Bob')
      expect(signerAlice.publicKey).not.toEqual(signerBob.publicKey)
    })
  })

  describe('createDevSigner', () => {
    it('should create an ECDSA signer for EVM dev accounts', () => {
      vi.mocked(getEvmPrivateKeyHex).mockReturnValue(
        '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
      )

      const signer = createDevSigner('//Alith')

      expect(getEvmPrivateKeyHex).toHaveBeenCalledWith('//Alith')
      expect(signer.publicKey.length).toBe(20)
    })

    it('should create an Sr25519 signer for non-EVM dev accounts', () => {
      vi.mocked(getEvmPrivateKeyHex).mockReturnValue(undefined)

      const signer = createDevSigner('//Alice')

      expect(getEvmPrivateKeyHex).toHaveBeenCalledWith('//Alice')
      expect(signer.publicKey.length).toBe(32)
    })

    it('should handle different EVM account paths', () => {
      vi.mocked(getEvmPrivateKeyHex).mockReturnValue(
        '0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b'
      )

      const signer = createDevSigner('//Baltathar')

      expect(getEvmPrivateKeyHex).toHaveBeenCalledWith('//Baltathar')
      expect(signer.publicKey.length).toBe(20)
    })
  })

  describe('deriveAddress', () => {
    it('should derive an EVM hex address for EVM dev accounts', () => {
      vi.mocked(getEvmPrivateKeyHex).mockReturnValue(
        '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
      )

      const address = deriveAddress('//Alith')

      expect(getEvmPrivateKeyHex).toHaveBeenCalledWith('//Alith')
      expect(address).toMatch(/^0x[0-9a-f]{40}$/i)
      expect(address.toLowerCase()).toBe('0xf24ff3a9cf04c71dbc94d0b566f7a27b94566cac')
    })

    it('should derive a SS58 address for non-EVM dev accounts', () => {
      vi.mocked(getEvmPrivateKeyHex).mockReturnValue(undefined)

      const address = deriveAddress('//Alice')

      expect(getEvmPrivateKeyHex).toHaveBeenCalledWith('//Alice')
      expect(address.length).toBeGreaterThan(40)
      expect(address).not.toMatch(/^0x/)
    })

    it('should derive the correct SS58 address for Alice', () => {
      vi.mocked(getEvmPrivateKeyHex).mockReturnValue(undefined)
      const address = deriveAddress('//Alice')
      expect(address).toBe('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
    })

    it('should derive correct EVM address for Baltathar', () => {
      vi.mocked(getEvmPrivateKeyHex).mockReturnValue(
        '0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b'
      )
      const address = deriveAddress('//Baltathar')
      expect(address).toMatch(/^0x[0-9a-f]{40}$/i)
      expect(address.toLowerCase()).toBe('0x3cd0a705a2dc65e5b1e1205896baa2be8a07c6e0')
    })
  })
})
