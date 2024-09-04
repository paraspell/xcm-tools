import { describe, it, expect } from 'vitest'
import { Parents, Version } from '../../types'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'

describe('getModifiedCurrencySelection', () => {
  it('returns correct structure with all parameters provided', () => {
    const version = Version.V2
    const amount = '1000'
    const currencyId = '123'
    const paraIdTo = 2000

    const result = getModifiedCurrencySelection(version, amount, currencyId, paraIdTo)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: {
              X3: [{ Parachain: paraIdTo }, { PalletInstance: '50' }, { GeneralIndex: currencyId }]
            }
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })

  it('returns correct structure without currencyId', () => {
    const version = Version.V1
    const amount = '500'
    const paraIdTo = 1000

    const result = getModifiedCurrencySelection(version, amount, undefined, paraIdTo)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: {
              X3: [{ Parachain: paraIdTo }, { PalletInstance: '50' }, { GeneralIndex: undefined }]
            }
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })

  it('returns correct structure without paraIdTo', () => {
    const version = Version.V3
    const amount = '1500'
    const currencyId = '321'

    const result = getModifiedCurrencySelection(version, amount, currencyId, undefined)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: {
              X3: [{ Parachain: undefined }, { PalletInstance: '50' }, { GeneralIndex: currencyId }]
            }
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })
})
