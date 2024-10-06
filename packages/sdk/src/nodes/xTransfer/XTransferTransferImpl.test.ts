import { describe, it, expect, vi } from 'vitest'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { determineDestWeight } from './determineDestWeight'
import { getDestination } from './getDestination'
import XTransferTransferImpl from './XTransferTransferImpl'
import type {
  TCurrencySelectionHeaderArr,
  TMultiLocation,
  XTransferTransferInput
} from '../../types'
import { Parents, Version } from '../../types'
import type { ApiPromise } from '@polkadot/api'

const mockApi = {
  tx: { xTransfer: { transfer: vi.fn() } }
} as unknown as ApiPromise

const mockMultiLocation: TMultiLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

const mockCurrencySpec: TCurrencySelectionHeaderArr = {
  [Version.V4]: [
    {
      id: mockMultiLocation,
      fun: {
        Fungible: '123'
      }
    }
  ]
}

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createCurrencySpec: vi.fn()
}))

vi.mock('./determineDestWeight', () => ({
  determineDestWeight: vi.fn()
}))

vi.mock('./getDestination', () => ({
  getDestination: vi.fn()
}))

describe('XTransferTransferImpl', () => {
  it('throws an error for multi-location destinations', () => {
    const input = {
      api: {},
      amount: '100',
      origin: 'Khala',
      destination: mockMultiLocation,
      serializedApiCallEnabled: false
    } as XTransferTransferInput
    expect(() => XTransferTransferImpl.transferXTransfer(input)).toThrow(
      'Multilocation destinations are not supported for specific transfer you are trying to create.'
    )
  })

  it('returns structured data for serialized API calls', () => {
    const input = {
      api: mockApi,
      amount: '100',
      currency: '123',
      currencyID: '123',
      recipientAddress: 'Recipient',
      origin: 'Phala',
      destination: 'Acala',
      serializedApiCallEnabled: true
    } as XTransferTransferInput
    vi.mocked(createCurrencySpec).mockReturnValue(mockCurrencySpec)
    vi.mocked(getDestination).mockReturnValue(mockMultiLocation)

    const mockDestWeight = {
      refTime: '6000000000',
      proofSize: '1000000'
    }

    vi.mocked(determineDestWeight).mockReturnValue(mockDestWeight)

    const result = XTransferTransferImpl.transferXTransfer(input)

    expect(result).toEqual({
      module: 'xTransfer',
      section: 'transfer',
      parameters: [Object.values(mockCurrencySpec)[0][0], mockMultiLocation, mockDestWeight]
    })
  })

  it('executes transaction for non-serialized calls with Khala as origin', () => {
    const input = {
      api: mockApi,
      amount: '200',
      origin: 'Khala',
      destination: 'Phala',
      serializedApiCallEnabled: false
    } as XTransferTransferInput

    vi.mocked(createCurrencySpec).mockReturnValue(mockCurrencySpec)
    vi.mocked(getDestination).mockReturnValue(mockMultiLocation)

    XTransferTransferImpl.transferXTransfer(input)

    expect(mockApi.tx.xTransfer.transfer).toHaveBeenCalledWith(
      Object.values(mockCurrencySpec)[0][0],
      mockMultiLocation,
      null
    )
  })

  it('executes transaction for non-serialized calls with Phala as origin', () => {
    const input = {
      api: mockApi,
      amount: '200',
      origin: 'Phala',
      destination: 'Karura',
      serializedApiCallEnabled: false
    } as XTransferTransferInput

    vi.mocked(createCurrencySpec).mockReturnValue(mockCurrencySpec)
    vi.mocked(getDestination).mockReturnValue(mockMultiLocation)

    const mockDestWeight = {
      refTime: '6000000000',
      proofSize: '1000000'
    }

    vi.mocked(determineDestWeight).mockReturnValue(mockDestWeight)

    XTransferTransferImpl.transferXTransfer(input)

    expect(mockApi.tx.xTransfer.transfer).toHaveBeenCalledWith(
      Object.values(mockCurrencySpec)[0][0],
      mockMultiLocation,
      mockDestWeight
    )
  })
})
