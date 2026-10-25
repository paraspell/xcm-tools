import type { TxCreator } from 'polkadot-api'
import { mnemonicToSeedSync } from '@scure/bip39'
import { HDKey } from '@scure/bip32'
import { DEV_PHRASE } from '@polkadot-labs/hdkd-helpers'
import { TPallet, TPapiTransaction } from '../src'
import { TSerializedExtrinsics } from '@paraspell/sdk-core'
import { createEcdsaSigner, createSr25519Signer } from '../src/utils'
import { createTxValidator } from '../../sdk-core/e2e'

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

export const validateTx = createTxValidator(serializeTx, (tx, signer: TxCreator) =>
  tx.create(signer)
)

export const createSigners = (): [TxCreator, TxCreator] => [
  createSr25519Signer('//Alice'),
  getEcdsaSigner()
]
