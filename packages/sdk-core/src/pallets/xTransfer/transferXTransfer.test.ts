import type { TAsset } from '@paraspell/assets'
import { Parents, type TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TXTransferTransferOptions } from '../../types'
import { assertToIsString, createBeneficiaryLocXTokens } from '../../utils'
import { createAsset, maybeOverrideAsset } from '../../utils/asset'
import { transferXTransfer } from './transferXTransfer'
import { determineDestWeight } from './utils/determineDestWeight'

const mockApi = {
  deserializeExtrinsics: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

const mockLocation: TLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

const mockAsset: TAsset = {
  id: mockLocation,
  fun: {
    Fungible: 123n
  }
}

vi.mock('../../utils/asset', () => ({
  createAsset: vi.fn(),
  maybeOverrideAsset: vi.fn()
}))

vi.mock('./utils/determineDestWeight', () => ({
  determineDestWeight: vi.fn()
}))

vi.mock('../../utils', () => ({
  createBeneficiaryLocXTokens: vi.fn(),
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
      asset: { symbol: 'KSM', amount: 100n }
    } as TXTransferTransferOptions<unknown, unknown>

    vi.mocked(createAsset).mockReturnValue(mockAsset)
    vi.mocked(maybeOverrideAsset).mockReturnValue(mockAsset)
    vi.mocked(createBeneficiaryLocXTokens).mockReturnValue(mockLocation)

    const callSpy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    transferXTransfer(input)

    expect(assertToIsString).toHaveBeenCalledOnce()
    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTransfer',
      method: 'transfer',
      params: {
        asset: mockAsset,
        dest: mockLocation,
        dest_weight: undefined
      }
    })
  })

  it('executes transaction with Phala as origin', () => {
    const input = {
      api: mockApi,
      origin: 'Phala',
      destination: 'Karura',
      asset: { symbol: 'KSM', amount: 100n }
    } as TXTransferTransferOptions<unknown, unknown>

    vi.mocked(createAsset).mockReturnValue(mockAsset)
    vi.mocked(maybeOverrideAsset).mockReturnValue(mockAsset)
    vi.mocked(createBeneficiaryLocXTokens).mockReturnValue(mockLocation)

    const mockDestWeight = {
      ref_time: 6000000000n,
      proof_size: 1000000n
    }

    vi.mocked(determineDestWeight).mockReturnValue(mockDestWeight)

    const callSpy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    transferXTransfer(input)

    expect(assertToIsString).toHaveBeenCalledOnce()
    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTransfer',
      method: 'transfer',
      params: {
        asset: mockAsset,
        dest: mockLocation,
        dest_weight: mockDestWeight
      }
    })
  })
})
