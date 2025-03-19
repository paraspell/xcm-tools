/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FixedSizeBinary } from 'polkadot-api'

export const checkAndConvertToNumberOrBigInt = (input: string) => {
  if (!/^-?\d+$/.test(input)) {
    throw new Error('Invalid integer string')
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

    if (keys.length === 1 && keys[0] !== 'info') {
      const key = keys[0]
      const value = obj[key]

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
      } else if (key === 'call') {
        return {
          type: key,
          value: value
        }
      } else if (key === 'OtherReserve') {
        return {
          type: key,
          value: checkAndConvertToNumberOrBigInt(value)
        }
      } else if (key === 'PalletInstance' || key === 'GeneralIndex') {
        return {
          type: key,
          value: value
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

        if (typeof v === 'string' && v.startsWith('0x')) {
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
