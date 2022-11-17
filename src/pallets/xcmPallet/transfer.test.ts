import { describe, expect, it } from 'vitest'
import { createApiInstance } from '../../utils'
import { InvalidCurrencyError } from './InvalidCurrencyError'
import { transferParaToRelay } from './transfer'

const fakeAddress = '0x00000000'
const amount = 1000
const currencyID = -1

describe('transferParaToRelay', () => {
  it('should throw an InvalidCurrencyError when passing Acala and UNIT', () => {
    return createApiInstance('wss://para.f3joule.space')
      .then((api) => {
        const t = () => {
          transferParaToRelay(
            api,
            'Acala',
            'UNIT',
            currencyID,
            amount,
            fakeAddress
          )
        }
        expect(t).toThrowError(InvalidCurrencyError)
      })
  })
  it('should not throw an InvalidCurrencyError when passing Acala and ACA', () => {
    return createApiInstance('wss://para.f3joule.space')
      .then((api) => {
        const t = () => {
          transferParaToRelay(
            api,
            'Acala',
            'ACA',
            currencyID,
            amount,
            fakeAddress
          )
        }
        expect(t).not.toThrowError(InvalidCurrencyError)
      })
  })
})
