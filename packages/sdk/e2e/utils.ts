import { getPolkadotSigner, PolkadotSigner } from 'polkadot-api/signer'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { mnemonicToSeedSync } from '@scure/bip39'
import { HDKey } from '@scure/bip32'
import { DEV_PHRASE, entropyToMiniSecret, mnemonicToEntropy } from '@polkadot-labs/hdkd-helpers'
import { sr25519CreateDerive } from '@polkadot-labs/hdkd'
import { TPallet, TPapiApi, TPapiTransaction } from '../src'
import { expect } from 'vitest'
import {
  GeneralBuilder,
  TSendBaseOptionsWithSenderAddress,
  TSerializedExtrinsics
} from '@paraspell/sdk-core'

export const createSr25519Signer = () => {
  const miniSecret = entropyToMiniSecret(mnemonicToEntropy(DEV_PHRASE))
  const derive = sr25519CreateDerive(miniSecret)
  const aliceKeyPair = derive('//Alice')
  return getPolkadotSigner(aliceKeyPair.publicKey, 'Sr25519', aliceKeyPair.sign)
}

export const signEcdsa = (input: Uint8Array, privateKey: Uint8Array) => {
  const signature = secp256k1.sign(keccak_256(input), privateKey, {
    prehash: false,
    format: 'recovered'
  })
  return Uint8Array.from([...signature.slice(1), signature[0]])
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

  return getPolkadotSigner(publicAddress, 'Ecdsa', input => signEcdsa(input, privateKey))
}

const serializeTx = (tx: TPapiTransaction): TSerializedExtrinsics => {
  const call = tx.decodedCall
  return {
    module: call.type as TPallet,
    method: call.value.type,
    params: call.value.value
  }
}

export const validateTx = async (tx: TPapiTransaction, signer: PolkadotSigner) => {
  expect(tx).toBeDefined()
  const hex = await tx.sign(signer)
  expect(hex).toBeDefined()
  const serialized = serializeTx(tx)
  expect(serialized).toMatchSnapshot()
}

export const validateTransfer = async (
  builder: GeneralBuilder<TPapiApi, TPapiTransaction, TSendBaseOptionsWithSenderAddress>,
  signer: PolkadotSigner
) => {
  const tx = await builder.build()
  await validateTx(tx, signer)
  const feeRes = await builder.getXcmFee()
  expect(feeRes.failureReason).toBeUndefined()
}
