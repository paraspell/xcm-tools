/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { InvalidCurrencyError } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { addXcmVersionHeader, createDestination } from '../../pallets/xcmPallet/utils'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { Version } from '../../types'
import { createBeneficiary } from '../createBeneficiary'
import { transformMultiLocation } from '../multiLocation'
import { createExecuteXcm } from './createExecuteXcm'

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createDestination: vi.fn(),
  addXcmVersionHeader: vi.fn()
}))

vi.mock('../createBeneficiary', () => ({
  createBeneficiary: vi.fn()
}))

vi.mock('../multiLocation', () => ({
  transformMultiLocation: vi.fn()
}))

describe('createExecuteXcm', () => {
  const dummyDest = 'destValue' as unknown as TMultiLocation
  const dummyBeneficiary = 'beneficiaryValue' as unknown as TMultiLocation
  const version = Version.V4

  beforeEach(() => {
    vi.mocked(createDestination).mockReturnValue(dummyDest)
    vi.mocked(createBeneficiary).mockReturnValue(dummyBeneficiary)
    vi.mocked(transformMultiLocation).mockReturnValue(
      'transformedLocation' as unknown as TMultiLocation
    )
    vi.mocked(addXcmVersionHeader).mockImplementation((xcm, version) => ({ [version]: xcm }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should throw an error if asset.multiLocation is not provided', () => {
    const fakeApi = {}
    const input = {
      api: fakeApi,
      asset: {
        amount: '1000'
      },
      scenario: 'test-scenario',
      destination: 'dest',
      paraIdTo: 200,
      address: 'address'
    } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>
    const executionFee = 50n
    expect(() => createExecuteXcm(input, executionFee, version)).toThrow(InvalidCurrencyError)
  })

  it('should construct the correct call and return the api.callTxMethod result when version is provided', () => {
    const fakeApi = {}
    const input = {
      api: fakeApi,
      version: Version.V4,
      asset: {
        multiLocation: { foo: 'bar' },
        amount: '1000'
      },
      feeAsset: {
        multiLocation: { foo: 'bar' },
        amount: '1000'
      },
      scenario: 'test-scenario',
      destination: 'dest',
      paraIdTo: 200,
      address: 'address'
    } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>

    const executionFee = 50n

    const result = createExecuteXcm(input, executionFee, version)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = result.V4 as any[]

    expect(Array.isArray(message)).toBe(true)
    expect(message).toHaveLength(3)

    const withdrawAsset = message[0].WithdrawAsset
    expect(withdrawAsset).toHaveLength(1)
    expect(withdrawAsset[0].id).toBe('transformedLocation')
    expect(withdrawAsset[0].fun).toEqual({ Fungible: 1000n })

    const buyExecution = message[1].BuyExecution
    expect(buyExecution.fees.id).toBe('transformedLocation')
    expect(buyExecution.fees.fun).toEqual({ Fungible: executionFee })
    expect(buyExecution.weight_limit).toEqual({
      Limited: { ref_time: 150n, proof_size: 0n }
    })

    const depositReserveAsset = message[2].DepositReserveAsset
    expect(depositReserveAsset.assets.Definite[0]).toEqual({
      id: 'transformedLocation',
      fun: { Fungible: 950n }
    })
    expect(depositReserveAsset.dest).toBe('destValue')
    expect(depositReserveAsset.xcm).toHaveLength(2)
    expect(depositReserveAsset.xcm[0].BuyExecution.fees).toEqual({
      id: input.asset.multiLocation,
      fun: { Fungible: 900n }
    })
    expect(depositReserveAsset.xcm[0].BuyExecution.weight_limit).toBe('Unlimited')
    expect(depositReserveAsset.xcm[1].DepositAsset.beneficiary).toBe('beneficiaryValue')
  })

  it('should call createDestination and createBeneficiary with correct args', () => {
    const fakeApi = {}
    const input = {
      api: fakeApi,
      asset: {
        multiLocation: { foo: 'bar' },
        amount: 2000
      },
      scenario: 'scenario-default',
      destination: 'destination-default',
      paraIdTo: 300,
      address: 'address-default'
    } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>
    const executionFee = 100n

    createExecuteXcm(input, executionFee, version)

    expect(createDestination).toHaveBeenCalledWith(
      input.scenario,
      version,
      input.destination,
      input.paraIdTo
    )
    expect(createBeneficiary).toHaveBeenCalledWith({
      api: input.api,
      scenario: input.scenario,
      pallet: 'PolkadotXcm',
      recipientAddress: input.address,
      version,
      paraId: input.paraIdTo
    })
  })
})
