import { describe, it, expect, vi } from 'vitest'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { determineDestWeight } from './determineDestWeight'
import { getDestination } from './getDestination'
import XTransferTransferImpl from './XTransferTransferImpl'
import type {
  TCurrencySelectionHeaderArr,
  TMultiLocation,
  TXTransferTransferOptions
} from '../../types'
import { Parents, Version } from '../../types'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic, TPjsApi } from '../../pjs/types'
import type { IPolkadotApi } from '../../api'

const mockApi = {
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<TPjsApi, Extrinsic>

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
      origin: 'Khala',
      destination: mockMultiLocation
    } as TXTransferTransferOptions<ApiPromise, Extrinsic>
    expect(() => XTransferTransferImpl.transferXTransfer(input)).toThrow(
      'Multilocation destinations are not supported for specific transfer you are trying to create.'
    )
  })

  it('executes transaction with Khala as origin', () => {
    const input = {
      api: mockApi,
      origin: 'Khala',
      destination: 'Phala',
      asset: { symbol: 'KSM', amount: 100 }
    } as TXTransferTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(createCurrencySpec).mockReturnValue(mockCurrencySpec)
    vi.mocked(getDestination).mockReturnValue(mockMultiLocation)

    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    XTransferTransferImpl.transferXTransfer(input)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTransfer',
      section: 'transfer',
      parameters: {
        asset: Object.values(mockCurrencySpec)[0][0],
        dest: mockMultiLocation,
        dest_weight: null
      }
    })
  })

  it('executes transaction with Phala as origin', () => {
    const input = {
      api: mockApi,
      origin: 'Phala',
      destination: 'Karura',
      asset: { symbol: 'KSM', amount: 100 }
    } as TXTransferTransferOptions<ApiPromise, Extrinsic>

    vi.mocked(createCurrencySpec).mockReturnValue(mockCurrencySpec)
    vi.mocked(getDestination).mockReturnValue(mockMultiLocation)

    const mockDestWeight = {
      refTime: '6000000000',
      proofSize: '1000000'
    }

    vi.mocked(determineDestWeight).mockReturnValue(mockDestWeight)

    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    XTransferTransferImpl.transferXTransfer(input)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTransfer',
      section: 'transfer',
      parameters: {
        asset: Object.values(mockCurrencySpec)[0][0],
        dest: mockMultiLocation,
        dest_weight: mockDestWeight
      }
    })
  })
})
