import type { TMultiAsset } from '@paraspell/assets'
import { Parents, type TMultiLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TXTransferTransferOptions } from '../../types'
import { assertToIsString, createBeneficiaryMultiLocation } from '../../utils'
import { createMultiAsset, maybeOverrideMultiAsset } from '../../utils/multiAsset'
import { transferXTransfer } from './transferXTransfer'
import { determineDestWeight } from './utils/determineDestWeight'

const mockApi = {
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

const mockMultiLocation: TMultiLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

const mockMultiAsset: TMultiAsset = {
  id: mockMultiLocation,
  fun: {
    Fungible: '123'
  }
}

vi.mock('../../utils/multiAsset', () => ({
  createMultiAsset: vi.fn(),
  maybeOverrideMultiAsset: vi.fn()
}))

vi.mock('./utils/determineDestWeight', () => ({
  determineDestWeight: vi.fn()
}))

vi.mock('../../utils', () => ({
  createBeneficiaryMultiLocation: vi.fn(),
  assertToIsString: vi.fn()
}))

describe('XTransferTransferImpl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes transaction with Phala as origin', () => {
    const input = {
      api: mockApi,
      origin: 'Phala',
      destination: 'Basilisk',
      asset: { symbol: 'KSM', amount: 100 }
    } as TXTransferTransferOptions<unknown, unknown>

    vi.mocked(createMultiAsset).mockReturnValue(mockMultiAsset)
    vi.mocked(maybeOverrideMultiAsset).mockReturnValue(mockMultiAsset)
    vi.mocked(createBeneficiaryMultiLocation).mockReturnValue(mockMultiLocation)

    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    transferXTransfer(input)

    expect(assertToIsString).toHaveBeenCalledOnce()
    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTransfer',
      method: 'transfer',
      parameters: {
        asset: mockMultiAsset,
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

    vi.mocked(createMultiAsset).mockReturnValue(mockMultiAsset)
    vi.mocked(maybeOverrideMultiAsset).mockReturnValue(mockMultiAsset)
    vi.mocked(createBeneficiaryMultiLocation).mockReturnValue(mockMultiLocation)

    const mockDestWeight = {
      ref_time: 6000000000n,
      proof_size: 1000000n
    }

    vi.mocked(determineDestWeight).mockReturnValue(mockDestWeight)

    const callSpy = vi.spyOn(mockApi, 'callTxMethod')

    transferXTransfer(input)

    expect(assertToIsString).toHaveBeenCalledOnce()
    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTransfer',
      method: 'transfer',
      parameters: {
        asset: mockMultiAsset,
        dest: mockMultiLocation,
        dest_weight: mockDestWeight
      }
    })
  })
})
