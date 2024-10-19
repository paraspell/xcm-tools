import { InvalidCurrencyError } from '../../errors'
import type { XTokensTransferInput } from '../../types'
import { Parents, Version } from '../../types'
import { getModifiedCurrencySelection } from './getModifiedCurrencySelection'
import { describe, it, expect } from 'vitest'

describe('getModifiedCurrencySelection', () => {
  it('returns correct structure with all parameters provided', () => {
    const version = Version.V2
    const amount = '1000'
    const currencyID = '123'
    const paraIdTo = 2000

    const xTransferInput = {
      amount,
      currencyID,
      paraIdTo
    } as XTokensTransferInput

    const result = getModifiedCurrencySelection(version, xTransferInput)
    expect(result).toEqual({
      [version]: {
        id: {
          Concrete: {
            parents: Parents.ONE,
            interior: {
              X3: [{ Parachain: paraIdTo }, { PalletInstance: '50' }, { GeneralIndex: currencyID }]
            }
          }
        },
        fun: {
          Fungible: amount
        }
      }
    })
  })

  it('throws an error when currencyID is undefined or empty', () => {
    const version = Version.V1
    const amount = '500'
    const paraIdTo = 1000

    const xTransferInput = {
      amount,
      currencyID: undefined,
      paraIdTo
    } as XTokensTransferInput

    expect(() => getModifiedCurrencySelection(version, xTransferInput)).toThrow(
      InvalidCurrencyError
    )
  })

  it('returns correct structure with feeAsset provided', () => {
    const version = Version.V3
    const amount = '1500'
    const currencyID = '321'
    const paraIdTo = 3000
    const feeAsset = '500'

    const xTransferInput = {
      amount,
      currencyID,
      paraIdTo,
      feeAsset
    } as XTokensTransferInput

    const result = getModifiedCurrencySelection(version, xTransferInput)
    expect(result).toEqual({
      [version]: [
        {
          id: {
            Concrete: {
              parents: Parents.ONE,
              interior: {
                X3: [
                  { Parachain: paraIdTo },
                  { PalletInstance: '50' },
                  { GeneralIndex: currencyID }
                ]
              }
            }
          },
          fun: {
            Fungible: amount
          }
        }
      ]
    })
  })
})
