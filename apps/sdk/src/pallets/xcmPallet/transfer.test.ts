import { vi, describe, expect, it } from 'vitest'
import { TNode } from '../../types'
import { createApiInstance } from '../../utils'
import { InvalidCurrencyError } from './InvalidCurrencyError'
import { send } from './transfer'

vi.mock('../../utils', () => ({
  constructXTokens: vi.fn(),
  constructPolkadotXCM: vi.fn(),
  createApiInstance: vi.fn()
}))

const WS_URL = 'wss://para.f3joule.space'
const NODE: TNode = 'Acala'
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const AMOUNT = 1000
const CURRENCY_ACA = 'ACA'
const CURRENCY_UNIT = 'UNIT'
const CURRENCY_ID = -1

describe('transferParaToRelay', () => {
  it('should throw an InvalidCurrencyError when passing Acala and UNIT', async () => {
    const api = await createApiInstance(WS_URL)

    const t = () => {
      send(api, NODE, CURRENCY_UNIT, CURRENCY_ID, AMOUNT, ADDRESS)
    }
    expect(t).toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA', async () => {
    const api = await createApiInstance(WS_URL)

    const t = () => {
      send(api, NODE, CURRENCY_ACA, CURRENCY_ID, AMOUNT, ADDRESS)
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })
})
