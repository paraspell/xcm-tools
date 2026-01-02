import { EVM_DEV_PRIVATE_KEYS } from '../constants'

export const getEvmPrivateKeyHex = (path: string) => {
  const name = path.slice(2).toLowerCase()
  if (name in EVM_DEV_PRIVATE_KEYS) {
    return EVM_DEV_PRIVATE_KEYS[name as keyof typeof EVM_DEV_PRIVATE_KEYS]
  }
  return undefined
}
