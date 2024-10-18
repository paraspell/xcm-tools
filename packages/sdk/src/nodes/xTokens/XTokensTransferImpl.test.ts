import { describe, it, expect, vi } from 'vitest'
import { getCurrencySelection } from './getCurrencySelection'
import { getParameters } from './getParameters'
import XTokensTransferImpl from './XTokensTransferImpl'
import type { TMultiLocation, XTokensTransferInput } from '../../types'
import { Parents } from '../../types'
import type PolkadotJsApi from '../../api/PolkadotJsApi'

vi.mock('./getCurrencySelection', () => ({
  getCurrencySelection: vi.fn()
}))

vi.mock('./getParameters', () => ({
  getParameters: vi.fn()
}))

const mockMultiLocation: TMultiLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

const mockApi = {
  call: vi.fn()
} as unknown as PolkadotJsApi

describe('XTokensTransferImpl', () => {
  it('throws an error for multilocation destinations', () => {
    const input = {
      api: mockApi,
      origin: 'Acala',
      currency: '123',
      currencyID: '123',
      fees: 1000,
      amount: '1000',
      addressSelection: 'Address',
      destination: mockMultiLocation,
      feeAsset: '0',
      scenario: 'ParaToPara',
      serializedApiCallEnabled: false
    } as XTokensTransferInput

    expect(() => XTokensTransferImpl.transferXTokens(input, {})).toThrow(
      'Multilocation destinations are not supported for specific transfer you are trying to create.'
    )
  })

  it('returns structured data for serialized transfer calls - feeAsset provided', () => {
    const input = {
      api: mockApi,
      origin: 'Acala',
      amount: '2000',
      currency: '123',
      currencyID: '123',
      fees: 2000,
      scenario: 'ParaToPara',
      addressSelection: 'Address',
      destination: 'AssetHubPolkadot',
      feeAsset: 'XTK',
      serializedApiCallEnabled: true
    } as XTokensTransferInput
    const currencySelection = '123'

    vi.mocked(getCurrencySelection).mockReturnValue(currencySelection)
    vi.mocked(getParameters).mockReturnValue(['param1', 'param2', 'param3'])

    const result = XTokensTransferImpl.transferXTokens(input, currencySelection)

    expect(result).toEqual({
      module: 'xTokens',
      section: 'transferMultiassets',
      parameters: ['param1', 'param2', 'param3']
    })
  })

  it('returns structured data for serialized transfer calls - feeAsset not provided', () => {
    const input = {
      api: mockApi,
      origin: 'Acala',
      amount: '2000',
      currency: '123',
      currencyID: '123',
      fees: 2000,
      scenario: 'ParaToPara',
      addressSelection: 'Address',
      destination: 'AssetHubPolkadot',
      serializedApiCallEnabled: true
    } as XTokensTransferInput
    const currencySelection = '123'

    vi.mocked(getCurrencySelection).mockReturnValue(currencySelection)
    vi.mocked(getParameters).mockReturnValue(['param1', 'param2', 'param3'])

    const result = XTokensTransferImpl.transferXTokens(input, currencySelection)

    expect(result).toEqual({
      module: 'xTokens',
      section: 'transferMultiasset',
      parameters: ['param1', 'param2', 'param3']
    })
  })

  it('executes transfer transaction for non-serialized calls', () => {
    const input = {
      api: mockApi,
      origin: 'Acala',
      amount: '3000',
      currency: '123',
      currencyID: '123',
      fees: 3000,
      scenario: 'ParaToPara',
      addressSelection: 'Address',
      destination: 'Hydration',
      feeAsset: 'HDX',
      serializedApiCallEnabled: false
    } as XTokensTransferInput
    const currencySelection = '123'

    vi.mocked(getCurrencySelection).mockReturnValue(currencySelection)
    vi.mocked(getParameters).mockReturnValue(['param1', 'param2', 'param3'])

    const callSpy = vi.spyOn(mockApi, 'call')

    XTokensTransferImpl.transferXTokens(input, currencySelection)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'xTokens',
      section: 'transfer',
      parameters: ['param1', 'param2', 'param3']
    })
  })
})
