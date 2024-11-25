import { describe, it, expect, vi } from 'vitest'
import { getCurrencySelection } from './getCurrencySelection'
import { getXTokensParameters } from './getXTokensParameters'
import XTokensTransferImpl from './XTokensTransferImpl'
import type { TMultiLocation, TXTokensTransferOptions } from '../../types'
import { Parents } from '../../types'
import type { ApiPromise } from '@polkadot/api'
import type PolkadotJsApi from '../../pjs/PolkadotJsApi'
import type { Extrinsic } from '../../pjs/types'

vi.mock('./getCurrencySelection', () => ({
  getCurrencySelection: vi.fn()
}))

vi.mock('./getXTokensParameters', () => ({
  getXTokensParameters: vi.fn()
}))

const mockMultiLocation: TMultiLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

const mockApi = {
  callTxMethod: vi.fn()
} as unknown as PolkadotJsApi

describe('XTokensTransferImpl', () => {
  it('throws an error for multilocation destinations', () => {
    const input = {
      api: mockApi,
      origin: 'Acala',
      asset: {
        symbol: 'ACA',
        assetId: '123'
      },
      fees: 1000,
      amount: '1000',
      addressSelection: 'Address',
      destination: mockMultiLocation,
      feeAsset: '0',
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>

    expect(() => XTokensTransferImpl.transferXTokens(input, {})).toThrow(
      'Multilocation destinations are not supported for specific transfer you are trying to create.'
    )
  })

  it('executes transfer transaction', () => {
    const input = {
      api: mockApi,
      origin: 'Acala',
      amount: '3000',
      asset: {
        symbol: 'ACA',
        assetId: '123'
      },
      fees: 3000,
      scenario: 'ParaToPara',
      addressSelection: 'Address',
      destination: 'Hydration',
      feeAsset: 'HDX'
    } as TXTokensTransferOptions<ApiPromise, Extrinsic>
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
