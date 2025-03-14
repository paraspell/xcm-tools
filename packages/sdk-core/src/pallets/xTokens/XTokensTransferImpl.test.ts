import { Parents, type TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TXcmVersioned, TXTokensCurrencySelection, TXTokensTransferOptions } from '../../types'
import { getCurrencySelection } from './utils/getCurrencySelection'
import { getXTokensParameters } from './utils/getXTokensParameters'
import XTokensTransferImpl from './XTokensTransferImpl'

vi.mock('./utils/getCurrencySelection', () => ({
  getCurrencySelection: vi.fn()
}))

vi.mock('./utils/getXTokensParameters', () => ({
  getXTokensParameters: vi.fn()
}))

const mockMultiLocation: TMultiLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

const mockApi = {
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

describe('XTokensTransferImpl', () => {
  it('throws an error for multilocation destinations', () => {
    const input = {
      api: mockApi,
      origin: 'Acala',
      asset: {
        symbol: 'ACA',
        assetId: '123',
        amount: '1000'
      },
      fees: 1000,
      addressSelection: {} as TXcmVersioned<TMultiLocation>,
      destination: mockMultiLocation,
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<unknown, unknown>

    expect(() =>
      XTokensTransferImpl.transferXTokens(input, {} as TXTokensCurrencySelection)
    ).toThrow(
      'Multilocation destinations are not supported for specific transfer you are trying to create.'
    )
  })

  it('executes transfer transaction', () => {
    const input = {
      api: mockApi,
      origin: 'Acala',
      asset: {
        symbol: 'ACA',
        assetId: '123',
        amount: '3000'
      },
      fees: 3000,
      scenario: 'ParaToPara',
      addressSelection: {} as TXcmVersioned<TMultiLocation>,
      destination: 'Hydration'
    } as TXTokensTransferOptions<unknown, unknown>
    const currencySelection = '123'

    vi.mocked(getCurrencySelection).mockReturnValue(currencySelection)
    vi.mocked(getXTokensParameters).mockReturnValue({
      param1: 'value1',
      param2: 'value2',
      param3: 'value3'
    })
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    XTokensTransferImpl.transferXTokens(input, currencySelection)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTokens',
      section: 'transfer',
      parameters: {
        param1: 'value1',
        param2: 'value2',
        param3: 'value3'
      }
    })
  })
})
