import type { TxCreator } from 'polkadot-api'
import { mnemonicToSeedSync } from '@scure/bip39'
import { HDKey } from '@scure/bip32'
import { DEV_PHRASE } from '@polkadot-labs/hdkd-helpers'
import { TPallet, TPapiTransaction } from '../src'
import { expect } from 'vitest'
import { TSerializedExtrinsics } from '@paraspell/sdk-core'
import { createEcdsaSigner, createSr25519Signer } from '../src/utils'

export const getEcdsaSigner = () => {
  const seed = mnemonicToSeedSync(DEV_PHRASE)
  const hdkey = HDKey.fromMasterSeed(seed)
  const keyPair = hdkey.derive(`m/44'/60'/0'/0/0`)
  const privateKey = keyPair.privateKey
  if (!privateKey) throw new Error('Failed to derive private key')
  return createEcdsaSigner(privateKey)
}

const serializeTx = (tx: TPapiTransaction): TSerializedExtrinsics => {
  const call = tx.decodedCall
  return {
    module: call.type as TPallet,
    method: call.value.type,
    params: call.value.value
  }
}

export const validateTx = async (tx: TPapiTransaction, signer: TxCreator) => {
  expect(tx).toBeDefined()
  const hex = await tx.create(signer)
  expect(hex).toBeDefined()
  const serialized = serializeTx(tx)
  expect(serialized).toMatchSnapshot()
}

export const createSigners = (): [TxCreator, TxCreator] => [
  createSr25519Signer('//Alice'),
  getEcdsaSigner()
]
