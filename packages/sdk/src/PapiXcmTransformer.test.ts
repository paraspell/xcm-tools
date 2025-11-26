import type { SS58AddressInfo } from 'polkadot-api'
import { Binary, getSs58AddressInfo } from 'polkadot-api'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { checkAndConvertToNumberOrBigInt, transform } from './PapiXcmTransformer'

vi.mock('polkadot-api', () => ({
  getSs58AddressInfo: vi.fn(),
  FixedSizeBinary: {
    fromHex: vi.fn((hex: string) => `FixedSizeBinary(${hex})`)
  },
  Binary: {
    fromHex: vi.fn((hex: string) => `Binary(${hex})`)
  }
}))

describe('checkAndConvertToNumberOrBigInt', () => {
  it('should convert valid integer strings to numbers within safe range', () => {
    expect(checkAndConvertToNumberOrBigInt('42')).toBe(42)
    expect(checkAndConvertToNumberOrBigInt('-100')).toBe(-100)
  })

  it('should transform items array of hex string arrays using Binary.fromHex', () => {
    const input = {
      items: [['0xdead', '0xbeef'], ['0x00']]
    }

    const expected = {
      items: [['Binary(0xdead)', 'Binary(0xbeef)'], ['Binary(0x00)']]
    }

    const spy = vi.spyOn(Binary, 'fromHex')

    expect(transform(input)).toEqual(expected)

    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('should convert large integers to BigInt', () => {
    const largeNumber = '9007199254740992' // Number.MAX_SAFE_INTEGER + 1
    expect(checkAndConvertToNumberOrBigInt(largeNumber)).toBe(BigInt(largeNumber))
  })

  it('should throw an error for invalid integer strings', () => {
    expect(() => checkAndConvertToNumberOrBigInt('abc')).toThrow('Invalid integer string')
    expect(() => checkAndConvertToNumberOrBigInt('42.5')).toThrow('Invalid integer string')
    expect(() => checkAndConvertToNumberOrBigInt('')).toThrow('Invalid integer string')
  })
})

describe('transform', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getSs58AddressInfo).mockReturnValue({ isValid: false })
  })

  it('should return primitive values as is', () => {
    expect(transform(123)).toBe(123)
    expect(transform('test')).toBe('test')
    expect(transform(true)).toBe(true)
    expect(transform(null)).toBe(null)
    expect(transform(undefined)).toBe(undefined)
  })

  it('should transform arrays recursively', () => {
    const input = [1, 'two', { three: 3 }]
    const expected = [1, 'two', { type: 'three', value: 3 }]
    expect(transform(input)).toEqual(expected)
  })

  it('should transform AccountId32 correctly', () => {
    const input = {
      AccountId32: {
        network: 'any',
        id: '0x1234abcd'
      }
    }
    const expected = {
      type: 'AccountId32',
      value: {
        network: {
          type: 'Any'
        },
        id: `FixedSizeBinary(0x1234abcd)`
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should transform Id correctly', () => {
    const input = {
      Id: {
        id: '0xdeadbeef'
      }
    }
    const expected = {
      type: 'Id',
      value: {
        id: '0xdeadbeef'
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should not transform dest and target keys', () => {
    vi.mocked(getSs58AddressInfo).mockReturnValue({ isValid: true } as SS58AddressInfo)

    const input = {
      dest: '0x1234abcd',
      target: '0xdeadbeef'
    }
    const expected = {
      dest: '0x1234abcd',
      target: '0xdeadbeef'
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle OtherReserve with valid integer string', () => {
    const input = {
      OtherReserve: '12345678901234567890'
    }
    const expected = {
      type: 'OtherReserve',
      value: 12345678901234567890n
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should throw error for OtherReserve with invalid integer string', () => {
    const input = {
      OtherReserve: 'invalid_integer'
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    expect(() => transform(input)).toThrow('Invalid integer string')
  })

  it('should handle PalletInstance and GeneralIndex', () => {
    const input1 = {
      PalletInstance: 2
    }
    const expected1 = {
      type: 'PalletInstance',
      value: 2
    }
    expect(transform(input1)).toEqual(expected1)

    const input2 = {
      GeneralIndex: 10
    }
    const expected2 = {
      type: 'GeneralIndex',
      value: 10n
    }
    expect(transform(input2)).toEqual(expected2)
  })

  it('should handle Ethereum key', () => {
    const input = {
      Ethereum: {
        chain_id: 1
      }
    }
    const expected = {
      type: 'Ethereum',
      value: {
        chain_id: 1n
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle AccountKey20', () => {
    const input = {
      AccountKey20: {
        key: '0xabcdef1234567890'
      }
    }
    const expected = {
      type: 'AccountKey20',
      value: {
        key: `FixedSizeBinary(0xabcdef1234567890)`
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should transfer GlobalConsensus', () => {
    const input = {
      GlobalConsensus: {
        polkadot: null
      }
    }
    const expected = {
      type: 'GlobalConsensus',
      value: {
        type: 'Polkadot'
      }
    }

    expect(transform(input)).toEqual(expected)
  })

  it('should handle SetTopic', () => {
    const input = {
      SetTopic: '0xabcdef1234567890'
    }
    const expected = {
      type: 'SetTopic',
      value: `FixedSizeBinary(0xabcdef1234567890)`
    }

    expect(transform(input)).toEqual(expected)
  })

  it('should handle X1 with a single element', () => {
    const input = {
      X1: [
        {
          AccountId32: {
            network: 'any',
            id: '0x12345678'
          }
        }
      ]
    }
    const expected = {
      type: 'X1',
      value: {
        type: 'AccountId32',
        value: {
          network: {
            type: 'Any'
          },
          id: `FixedSizeBinary(0x12345678)`
        }
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle Fungible key', () => {
    const input = {
      Fungible: 1000
    }
    const expected = {
      type: 'Fungible',
      value: 1000
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle keys with string values', () => {
    const input = {
      SomeKey: 'SomeValue'
    }
    const expected = {
      type: 'SomeKey',
      value: {
        type: 'SomeValue'
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle keys with numeric values', () => {
    const input = {
      NumericKey: 12345
    }
    const expected = {
      type: 'NumericKey',
      value: 12345
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should transform nested objects with multiple keys', () => {
    const input = {
      fee_item: '5',
      currency_id: 100,
      amount: '5000000000',
      dest_weight: null,
      id: '0xdeadbeef',
      other_field: {
        PalletInstance: 3
      }
    }
    const expected = {
      fee_item: 5,
      currency_id: 100,
      amount: 5000000000n,
      dest_weight: undefined,
      id: `FixedSizeBinary(0xdeadbeef)`,
      other_field: {
        type: 'PalletInstance',
        value: 3
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle currency_id with non-integer string', () => {
    const input = {
      currency_id: 'USD'
    }
    const expected = {
      type: 'currency_id',
      value: {
        type: 'USD'
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle amount with invalid BigInt string', () => {
    const input = {
      amount: 'invalid_amount'
    }
    const expected = {
      type: 'amount',
      value: {
        type: 'invalid_amount'
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle id without 0x prefix', () => {
    const input = {
      id: 123456
    }
    const expected = {
      type: 'id',
      value: 123456
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle nested arrays and objects - AccountKey20 V2', () => {
    const input = [
      {
        AccountKey20: {
          key: '0xabcdef',
          network: 'any'
        }
      },
      {
        OtherReserve: '1000'
      }
    ]

    const expected = [
      {
        type: 'AccountKey20',
        value: {
          network: { type: 'Any' },
          key: `FixedSizeBinary(0xabcdef)`
        }
      },
      {
        type: 'OtherReserve',
        value: 1000
      }
    ]

    expect(transform(input)).toEqual(expected)
  })

  it('should handle nested arrays and objects', () => {
    const input = [
      {
        AccountKey20: {
          key: '0xabcdef'
        }
      },
      {
        OtherReserve: '1000'
      }
    ]

    const expected = [
      {
        type: 'AccountKey20',
        value: {
          key: `FixedSizeBinary(0xabcdef)`
        }
      },
      {
        type: 'OtherReserve',
        value: 1000
      }
    ]

    expect(transform(input)).toEqual(expected)
  })

  it('should handle X1 with multiple elements', () => {
    const input = {
      X1: [
        {
          PalletInstance: 1
        },
        {
          GeneralIndex: 2
        }
      ]
    }
    const expected = {
      type: 'X1',
      value: [
        {
          type: 'PalletInstance',
          value: 1
        },
        {
          type: 'GeneralIndex',
          value: 2n
        }
      ]
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should return empty object as is', () => {
    expect(transform({})).toEqual({})
  })

  it('should handle chain_id with other properties', () => {
    const input = {
      chain_id: 'network123',
      other_field: {
        PalletInstance: 1
      }
    }
    const expected = {
      chain_id: { type: 'network123' },
      other_field: {
        type: 'PalletInstance',
        value: 1
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle string types in nested objects', () => {
    const input = {
      X1: [
        {
          AccountId32: {
            network: 'any',
            id: '0x12345678'
          }
        },
        {
          SomeKey: 'SomeString'
        }
      ]
    }
    const expected = {
      type: 'X1',
      value: [
        {
          type: 'AccountId32',
          value: {
            network: { type: 'Any' },
            id: `FixedSizeBinary(0x12345678)`
          }
        },
        {
          type: 'SomeKey',
          value: { type: 'SomeString' }
        }
      ]
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle amount with a large BigInt string', () => {
    const input = {
      amount: '9007199254740992'
    }
    const expected = {
      type: 'amount',
      value: { type: '9007199254740992' }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle null values as properties in an object', () => {
    const input = {
      dest_weight: null,
      some_field: {
        GeneralIndex: 10
      }
    }
    const expected = {
      dest_weight: undefined,
      some_field: {
        type: 'GeneralIndex',
        value: 10n
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle currency_id with a non-numeric string gracefully', () => {
    const input = {
      currency_id: 'NOT_A_NUMBER'
    }
    const expected = {
      type: 'currency_id',
      value: {
        type: 'NOT_A_NUMBER'
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle an unknown object key with a nested structure', () => {
    const input = {
      unknown_key: { nested_key: 'nested_value' }
    }
    const expected = {
      type: 'unknown_key',
      value: {
        type: 'nested_key',
        value: { type: 'nested_value' }
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle currency_id with a numeric string that throws an error', () => {
    const input = { currency_id: 'invalid_numeric_string' }
    const expected = {
      type: 'currency_id',
      value: {
        type: 'invalid_numeric_string'
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle amount with a string that throws a BigInt conversion error', () => {
    const input = { amount: 'invalid_bigint_string' }
    const expected = {
      type: 'amount',
      value: {
        type: 'invalid_bigint_string'
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should set dest_weight to undefined when the value is null', () => {
    const input = { dest_weight: null }
    const expected = { type: 'dest_weight', value: null }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle id with a hex string starting with 0x', () => {
    const input = { id: '0xdeadbeef' }
    const expected = { type: 'id', value: { type: '0xdeadbeef' } }
    expect(transform(input)).toEqual(expected)
  })

  it('should process strings as type objects for any unmatched keys', () => {
    const input = { random_key: 'random_value' }
    const expected = {
      type: 'random_key',
      value: {
        type: 'random_value'
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle complex nested objects with multiple conditions', () => {
    const input = {
      complex_key: {
        fee_item: '5',
        amount: '1234',
        id: '0x1234abcd',
        nested_object: {
          currency_id: 'invalid_currency',
          dest_weight: null,
          extra_field: 'extra_value'
        }
      }
    }
    const expected = {
      type: 'complex_key',
      value: {
        fee_item: 5,
        amount: 1234n,
        id: `FixedSizeBinary(0x1234abcd)`,
        nested_object: {
          currency_id: { type: 'invalid_currency' },
          dest_weight: undefined,
          extra_field: { type: 'extra_value' }
        }
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle SetFeesMode with jit_withdraw true', () => {
    const input = {
      SetFeesMode: {
        jit_withdraw: true
      }
    }
    const expected = {
      type: 'SetFeesMode',
      value: {
        jit_withdraw: true
      }
    }
    expect(transform(input)).toEqual(expected)
  })

  it('should handle SetFeesMode with jit_withdraw false', () => {
    const input = {
      SetFeesMode: {
        jit_withdraw: false
      }
    }
    const expected = {
      type: 'SetFeesMode',
      value: {
        jit_withdraw: false
      }
    }
    expect(transform(input)).toEqual(expected)
  })
})
