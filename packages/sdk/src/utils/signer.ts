import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { getEvmPrivateKeyHex } from '@paraspell/sdk-core'
import { sr25519CreateDerive } from '@polkadot-labs/hdkd'
import { DEV_PHRASE, entropyToMiniSecret, mnemonicToEntropy } from '@polkadot-labs/hdkd-helpers'
import { AccountId } from 'polkadot-api'
import { getPolkadotSigner } from 'polkadot-api/signer'

export const signEcdsa = (input: Uint8Array, privateKey: Uint8Array) => {
  const signature = secp256k1.sign(keccak_256(input), privateKey, {
    prehash: false,
    format: 'recovered'
  })
  return Uint8Array.from([...signature.slice(1), signature[0]])
}

const createSr25519Keypair = (path: string) => {
  const miniSecret = entropyToMiniSecret(mnemonicToEntropy(DEV_PHRASE))
  const derive = sr25519CreateDerive(miniSecret)
  return derive(path)
}

export const createSr25519Signer = (path: string) => {
  const keyPair = createSr25519Keypair(path)
  return getPolkadotSigner(keyPair.publicKey, 'Sr25519', keyPair.sign)
}

export const resolveEcdsaAddress = (privateKey: Uint8Array): Uint8Array =>
  keccak_256(secp256k1.getPublicKey(privateKey, false).slice(1)).slice(-20)

export const createEcdsaSigner = (privateKey: Uint8Array) => {
  const publicAddress = resolveEcdsaAddress(privateKey)
  return getPolkadotSigner(publicAddress, 'Ecdsa', input => signEcdsa(input, privateKey))
}

const getEvmPrivateKey = (path: string) => {
  const pkHex = getEvmPrivateKeyHex(path)
  if (pkHex) return hexToBytes(pkHex.slice(2))
  return undefined
}

export const createDevSigner = (path: string) => {
  const evmPrivateKey = getEvmPrivateKey(path)
  if (evmPrivateKey) return createEcdsaSigner(evmPrivateKey)
  return createSr25519Signer(path)
}

export const deriveAddress = (path: string): string => {
  const evmPrivateKey = getEvmPrivateKey(path)
  if (evmPrivateKey) {
    const address = resolveEcdsaAddress(evmPrivateKey)
    return `0x${bytesToHex(address)}`
  }
  const keyPair = createSr25519Keypair(path)
  return AccountId().dec(keyPair.publicKey)
}
