import { describe, it, expect, vi } from 'vitest'
import { getCurrency } from '../../pallets/xcmPallet/utils'
import { determineDestWeight } from './utils/determineDestWeight'
import { getDestination } from './utils/getDestination'
import XTransferTransferImpl from './XTransferTransferImpl'
import type { TMultiAsset, TMultiLocation, TXTransferTransferOptions } from '../../types'
import { Parents } from '../../types'
import type { IPolkadotApi } from '../../api'

const mockApi = {
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

const mockMultiLocation: TMultiLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

const mockMultiAssets: TMultiAsset[] = [
  {
    id: mockMultiLocation,
    fun: {
      Fungible: '123'
    }
  }
]

vi.mock('../xcmPallet/utils', () => ({
  getCurrency: vi.fn()
}))

vi.mock('./utils/determineDestWeight', () => ({
  determineDestWeight: vi.fn()
}))

vi.mock('./utils/getDestination', () => ({
  getDestination: vi.fn()
}))

describe('XTransferTransferImpl', () => {
  it('throws an error for multi-location destinations', () => {
    const input = {
      api: {},
      origin: 'Phala',
      destination: mockMultiLocation
    } as TXTransferTransferOptions<unknown, unknown>
    expect(() => XTransferTransferImpl.transferXTransfer(input)).toThrow(
      'Multilocation destinations are not supported for specific transfer you are trying to create.'
    )
  })

  it('executes transaction with Phala as origin', () => {
    const input = {
      api: mockApi,
      origin: 'Phala',
      destination: 'Basilisk',
      asset: { symbol: 'KSM', amount: 100 }
    } as TXTransferTransferOptions<unknown, unknown>

    vi.mocked(getCurrency).mockReturnValue(mockMultiAssets)
    vi.mocked(getDestination).mockReturnValue(mockMultiLocation)

    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    XTransferTransferImpl.transferXTransfer(input)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTransfer',
      section: 'transfer',
      parameters: {
        asset: mockMultiAssets[0],
        dest: mockMultiLocation,
        dest_weight: undefined
      }
    })
  })

  it('executes transaction with Phala as origin', () => {
    const input = {
      api: mockApi,
      origin: 'Phala',
      destination: 'Karura',
      asset: { symbol: 'KSM', amount: 100 }
    } as TXTransferTransferOptions<unknown, unknown>

    vi.mocked(getCurrency).mockReturnValue(mockMultiAssets)
    vi.mocked(getDestination).mockReturnValue(mockMultiLocation)

    const mockDestWeight = {
      ref_time: 6000000000n,
      proof_size: 1000000n
    }

    vi.mocked(determineDestWeight).mockReturnValue(mockDestWeight)

    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    XTransferTransferImpl.transferXTransfer(input)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTransfer',
      section: 'transfer',
      parameters: {
        asset: mockMultiAssets[0],
        dest: mockMultiLocation,
        dest_weight: mockDestWeight
      }
    })
  })
})
