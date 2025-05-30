import type { TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_MULTILOCATION } from '../../constants'
import type { TXcmVersioned, TXTokensCurrencySelection, TXTokensTransferOptions } from '../../types'
import { transferXTokens } from './transferXTokens'
import { getXTokensParameters } from './utils/getXTokensParameters'

vi.mock('./utils/getCurrencySelection', () => ({
  getCurrencySelection: vi.fn()
}))

vi.mock('./utils/getXTokensParameters', () => ({
  getXTokensParameters: vi.fn()
}))

const mockApi = {
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

describe('transferXTokens', () => {
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
      destination: DOT_MULTILOCATION,
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<unknown, unknown>

    expect(() => transferXTokens(input, {} as TXTokensCurrencySelection)).toThrow(
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

    vi.mocked(getXTokensParameters).mockReturnValue({
      param1: 'value1',
      param2: 'value2',
      param3: 'value3'
    })
    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    transferXTokens(input, currencySelection)

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
