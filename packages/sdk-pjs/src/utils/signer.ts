import { getEvmPrivateKeyHex } from '@paraspell/sdk-core'
import { Keyring } from '@polkadot/api'

export const createKeyringPair = (path: string) => {
  const evmPrivateKey = getEvmPrivateKeyHex(path)
  const keyring = new Keyring({ type: 'sr25519' })
  return evmPrivateKey
    ? keyring.createFromUri(evmPrivateKey, undefined, 'ethereum')
    : keyring.addFromUri(path)
}
