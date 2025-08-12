import { isRelayChain, TRelaychain, TSubstrateChain } from '@paraspell/sdk-common'
import { getChain } from '../../../sdk-core/src'
import { ApiPromise } from '@polkadot/api'
import { normalizeLocation } from '../../src'

export const getRelayChainSymbolOf = (chain: TSubstrateChain): string => {
  const symbolMap: Record<TRelaychain, string> = {
    Polkadot: 'DOT',
    Kusama: 'KSM',
    Westend: 'WND',
    Paseo: 'PAS'
  }

  // Check if chain itself is a relay chain
  if (isRelayChain(chain)) return symbolMap[chain]

  const ecosystem = getChain(chain).ecosystem

  return symbolMap[ecosystem]
}

export const isChainEvm = (api: ApiPromise) => {
  const types = api.runtimeMetadata.asLatest.lookup.types
  const type = types[0]?.type.path.toJSON() as string[]
  return type.includes('AccountId20')
}

export const capitalizeLocation = (obj: any) => {
  obj.interior = capitalizeKeys(obj.interior)
  return normalizeLocation(obj)
}

export const capitalizeKeys = (obj: any, depth: number = 1): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj // Primitive value, return as is
  }

  if (Array.isArray(obj)) {
    // Process each element in the array
    return obj.map(element => capitalizeKeys(element, depth))
  }

  const newObj: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      let value = obj[key]
      const isLeafNode = typeof value !== 'object' || value === null

      let capitalizedKey: string
      if (depth <= 2 || !isLeafNode) {
        // Capitalize the key
        capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
      } else {
        // Do not capitalize leaf nodes beyond depth 2
        capitalizedKey = key
      }

      if (key === 'generalKey' && typeof value === 'string') {
        let data = value
        const hexString = data.startsWith('0x') ? data.slice(2) : data
        const byteLength = hexString.length / 2 // Each byte is two hex characters

        // Pad hexString with trailing zeros to make it 32 bytes (64 hex characters)
        const paddedHexString = hexString.padEnd(64, '0') // 64 hex chars = 32 bytes
        data = '0x' + paddedHexString

        value = {
          length: byteLength,
          data: data
        }
      }

      // Recursively process nested objects
      newObj[capitalizedKey] = capitalizeKeys(value, depth + 1)
    }
  }
  return newObj
}

export const typedEntries = <T extends Record<string, any>>(obj: T): [keyof T, T[keyof T]][] =>
  Object.entries(obj) as [keyof T, T[keyof T]][]
