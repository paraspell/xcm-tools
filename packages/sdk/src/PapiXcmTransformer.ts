/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { InvalidParameterError } from '@paraspell/sdk-core'
import { Binary, FixedSizeBinary, getSs58AddressInfo } from 'polkadot-api'
import { isAddress } from 'viem'

export const checkAndConvertToNumberOrBigInt = (input: string) => {
  if (!/^-?\d+$/.test(input)) {
    throw new InvalidParameterError('Invalid integer string')
  }

  const bigIntValue = BigInt(input)

  if (bigIntValue >= Number.MIN_SAFE_INTEGER && bigIntValue <= Number.MAX_SAFE_INTEGER) {
    return Number(bigIntValue)
  }

  return bigIntValue
}

export const transform = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(transform)
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj)

    if (keys.length === 1) {
      const key = keys[0]
      const value = obj[key]

      if (key === 'items' && Array.isArray(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return { items: value.map(item => item.map((i: string) => Binary.fromHex(i))) }
      }

      if (key === 'AccountId32') {
        return {
          type: key,
          value: {
            network:
              value.network === 'any'
                ? {
                    type: 'Any'
                  }
                : undefined,
            id: FixedSizeBinary.fromHex(value.id)
          }
        }
      } else if (key === 'Id') {
        return {
          type: key,
          value
        }
      } else if (key === 'Substrate') {
        return {
          type: key,
          value
        }
      } else if (key === 'OtherReserve') {
        return {
          type: key,
          value: checkAndConvertToNumberOrBigInt(value)
        }
      } else if (
        key === 'GlobalConsensus' &&
        typeof value === 'object' &&
        ('polkadot' in value || 'kusama' in value)
      ) {
        return {
          type: key,
          value: {
            type: 'polkadot' in value ? 'Polkadot' : 'Kusama'
          }
        }
      } else if (key === 'PalletInstance') {
        return {
          type: key,
          value: value
        }
      } else if (key === 'GeneralIndex') {
        return {
          type: key,
          value: BigInt(value)
        }
      } else if (key === 'Ethereum') {
        return {
          type: key,
          value: {
            chain_id: BigInt('chainId' in value ? value.chainId : value.chain_id)
          }
        }
      } else if (key === 'AccountKey20') {
        return {
          type: key,
          value: {
            network:
              value.network === 'any'
                ? {
                    type: 'Any'
                  }
                : undefined,
            key: FixedSizeBinary.fromHex(value.key)
          }
        }
      } else if (key === 'SetTopic') {
        return {
          type: key,
          value: FixedSizeBinary.fromHex(value)
        }
      } else if (key === 'SetFeesMode') {
        return {
          type: key,
          value: {
            jit_withdraw: value.jit_withdraw ?? false
          }
        }
      } else if (key === 'X1' && Array.isArray(value)) {
        return {
          type: key,
          value: value.length === 1 ? transform(value[0]) : value.map(transform)
        }
      } else if (key === 'Fungible') {
        return {
          type: key,
          value: value
        }
      } else if (typeof value === 'string') {
        return {
          type: key,
          value: {
            type: value
          }
        }
      } else if (typeof value === 'number') {
        return {
          type: key,
          value: value
        }
      } else {
        return {
          type: key,
          value: transform(value)
        }
      }
    } else {
      const newObj: any = {}
      for (const k of keys) {
        const v = obj[k]

        if (k === 'fee_item') {
          newObj[k] = Number(v)
          continue
        }

        if (k === 'currency_id' && typeof v === 'string') {
          try {
            newObj[k] = checkAndConvertToNumberOrBigInt(v)
          } catch (_e) {
            newObj[k] = {
              type: v
            }
          }
        }

        if (k === 'amount' && typeof v === 'string') {
          try {
            newObj[k] = BigInt(v)
          } catch (_e) {
            newObj[k] = {
              type: v
            }
          }
          continue
        }

        if (k === 'dest_weight' && v === null) {
          newObj[k] = undefined
          continue
        }

        if (typeof v === 'string' && getSs58AddressInfo(v).isValid) {
          newObj[k] = v
          continue
        }

        if (typeof v === 'string' && isAddress(v)) {
          newObj[k] = v
        } else if (typeof v === 'string' && v.startsWith('0x')) {
          newObj[k] = FixedSizeBinary.fromHex(v)
        } else if (typeof v === 'string') {
          newObj[k] = {
            type: v
          }
        } else {
          newObj[k] = transform(v)
        }
      }
      return newObj
    }
  } else {
    // For primitive values
    return obj
  }
}
