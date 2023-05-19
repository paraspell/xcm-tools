//Tests designed to try different XCM Pallet XCM messages and errors

import { ApiPromise } from '@polkadot/api'
import { vi, describe, expect, it, beforeEach } from 'vitest'
import { NODE_NAMES } from '../../maps/consts'
import { createApiInstance } from '../../utils'
import { getAllAssetsSymbols } from '../assets'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { send } from './transfer'

vi.mock('../../utils', () => ({
  constructXTokens: vi.fn(),
  constructPolkadotXCM: vi.fn(),
  createApiInstance: vi.fn()
}))

const WS_URL = 'wss://para.f3joule.space'
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const AMOUNT = 1000

describe('send', () => {
  let api: ApiPromise

  beforeEach(async () => {
    api = await createApiInstance(WS_URL)
  })

  it('should throw an InvalidCurrencyError when passing Acala and UNIT', () => {
    const t = () => {
      send(api, 'Acala', 'UNIT', AMOUNT, ADDRESS)
    }
    expect(t).toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA', () => {
    const t = () => {
      send(api, 'Acala', 'ACA', AMOUNT, ADDRESS)
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA and Unique as destination', () => {
    const t = () => {
      send(api, 'Acala', 'UNQ', AMOUNT, ADDRESS, 'Unique')
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Karura and BSX and Basilisk as destination', () => {
    const t = () => {
      send(api, 'Karura', 'BSX', AMOUNT, ADDRESS, 'Basilisk')
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })

  it('should throw an InvalidCurrencyError when passing Acala and ACA and BifrostPolkadot as destination', () => {
    const t = () => {
      send(api, 'Acala', 'UNQ', AMOUNT, ADDRESS, 'BifrostPolkadot')
    }
    expect(t).toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing all defined symbols from all nodes', () => {
    NODE_NAMES.forEach(node => {
      const symbols = getAllAssetsSymbols(node)
      symbols.forEach(symbol => {
        const t = () => {
          send(api, node, symbol, AMOUNT, ADDRESS)
        }
        expect(t).not.toThrowError(InvalidCurrencyError)
      })
    })
  })
})
