import { getPolkadotSigner, PolkadotSigner } from 'polkadot-api/signer'
import { secp256k1 } from '@noble/curves/secp256k1'
import { keccak_256 } from '@noble/hashes/sha3'
import { mnemonicToSeedSync } from '@scure/bip39'
import { HDKey } from '@scure/bip32'
import { DEV_PHRASE, entropyToMiniSecret, mnemonicToEntropy } from '@polkadot-labs/hdkd-helpers'
import { sr25519CreateDerive } from '@polkadot-labs/hdkd'
import {
  getAssets,
  getNativeAssetSymbol,
  getRelayChainSymbol,
  hasSupportForAsset,
  isForeignAsset,
  NODE_NAMES_DOT_KSM,
  TNode,
  TPapiTransaction
} from '../src'
import { expect } from 'vitest'

export const createSr25519Signer = () => {
  const miniSecret = entropyToMiniSecret(mnemonicToEntropy(DEV_PHRASE))
  const derive = sr25519CreateDerive(miniSecret)
  const aliceKeyPair = derive('//Alice')
  return getPolkadotSigner(aliceKeyPair.publicKey, 'Sr25519', aliceKeyPair.sign)
}

export const signEcdsa = (
  hasher: (input: Uint8Array) => Uint8Array,
  value: Uint8Array,
  priv: Uint8Array
) => {
  const signature = secp256k1.sign(hasher(value), priv)
  const signedBytes = signature.toCompactRawBytes()

  const result = new Uint8Array(signedBytes.length + 1)
  result.set(signedBytes)
  result[signedBytes.length] = signature.recovery

  return result
}

export const createEcdsaSigner = () => {
  const seed = mnemonicToSeedSync(DEV_PHRASE)
  const hdkey = HDKey.fromMasterSeed(seed)
  const keyPair = hdkey.derive(`m/44'/60'/0'/0/0`)
  const privateKey = keyPair.privateKey
  if (!privateKey) {
    throw new Error('Failed to derive private key')
  }

  const publicAddress = keccak_256(secp256k1.getPublicKey(privateKey, false).slice(1)).slice(-20)

  return getPolkadotSigner(publicAddress, 'Ecdsa', input =>
    signEcdsa(keccak_256, input, privateKey)
  )
}

export const validateTx = async (tx: TPapiTransaction, signer: PolkadotSigner) => {
  expect(tx).toBeDefined()
  const hex = await tx.sign(signer)
  expect(hex).toBeDefined()
}

export const filteredNodes = NODE_NAMES_DOT_KSM.filter(
  node =>
    // PAPI UNSUPPORTED NODES START
    node !== 'ComposableFinance' &&
    node !== 'Interlay' &&
    node !== 'Parallel' &&
    node !== 'CrustShadow' &&
    node !== 'Kintsugi' &&
    node !== 'ParallelHeiko' &&
    node !== 'Picasso' &&
    node !== 'RobonomicsKusama' &&
    node !== 'RobonomicsPolkadot' &&
    node !== 'Turing' &&
    node !== 'Pendulum' &&
    node !== 'Subsocial' &&
    // WS endpoint not working
    node !== 'InvArchTinker'
)
