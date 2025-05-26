/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { TMultiLocation } from '@paraspell/sdk-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createVersionedDestination, extractVersionFromHeader } from '../pallets/xcmPallet/utils'
import type { TPolkadotXCMTransferOptions, TSerializedApiCall, TXcmVersioned } from '../types'
import { Version } from '../types'
import { createExecuteXcm } from './createExecuteXcm'
import { createVersionedBeneficiary } from './createVersionedBeneficiary'
import { transformMultiLocation } from './multiLocation'

vi.mock('../pallets/xcmPallet/utils', () => ({
  createVersionedDestination: vi.fn(),
  extractVersionFromHeader: vi.fn()
}))

vi.mock('./createVersionedBeneficiary', () => ({
  createVersionedBeneficiary: vi.fn()
}))

vi.mock('./multiLocation', () => ({
  transformMultiLocation: vi.fn()
}))

describe('createExecuteXcm', () => {
  const dummyDestHeader = 'dummyDestHeader' as unknown as TXcmVersioned<TMultiLocation>
  const dummyBeneficiaryHeader =
    'dummyBeneficiaryHeader' as unknown as TXcmVersioned<TMultiLocation>

  beforeEach(() => {
    vi.mocked(createVersionedDestination).mockReturnValue(dummyDestHeader)
    vi.mocked(createVersionedBeneficiary).mockReturnValue(dummyBeneficiaryHeader)
    vi.mocked(extractVersionFromHeader).mockImplementation(header => {
      if (header === dummyDestHeader) return [Version.V1, 'destValue']
      if (header === dummyBeneficiaryHeader) return [Version.V1, 'beneficiaryValue']
      return [Version.V4, 'transformedLocation']
    })
    vi.mocked(transformMultiLocation).mockReturnValue(
      'transformedLocation' as unknown as TMultiLocation
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should throw an error if asset.multiLocation is not provided', () => {
    const fakeApi = {
      callTxMethod: vi.fn()
    }
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
    const weight = {
      refTime: 123n,
      proofSize: 456n
    }
    const executionFee = 50n
    expect(() => createExecuteXcm(input, weight, executionFee)).toThrow(
      'Asset {"amount":"1000"} has no multiLocation'
    )
  })

  it('should construct the correct call and return the api.callTxMethod result when version is provided', () => {
    const fakeApi = {
      callTxMethod: vi.fn().mockReturnValue('result')
    }
    const input = {
      api: fakeApi,
      version: Version.V4,
      asset: {
        multiLocation: { foo: 'bar' },
        amount: '1000'
      },
      scenario: 'test-scenario',
      destination: 'dest',
      paraIdTo: 200,
      address: 'address'
    } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>
    const weight = {
      refTime: 123n,
      proofSize: 456n
    }
    const executionFee = 50n

    const result = createExecuteXcm(input, weight, executionFee)
    expect(result).toBe('result')
    expect(fakeApi.callTxMethod).toHaveBeenCalledTimes(1)
    const callArg = fakeApi.callTxMethod.mock.calls[0][0] as TSerializedApiCall
    expect(callArg.module).toBe('PolkadotXcm')
    expect(callArg.section).toBe('execute')
    expect(callArg.parameters.max_weight).toEqual({
      ref_time: weight.refTime,
      proof_size: weight.proofSize
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (callArg.parameters.message as Record<string, any>)[Version.V4] as any[]
    expect(Array.isArray(message)).toBe(true)
    expect(message).toHaveLength(3)
    const withdrawAsset = message[0].WithdrawAsset
    expect(withdrawAsset).toHaveLength(1)
    expect(withdrawAsset[0].id).toBe('transformedLocation')
    expect(withdrawAsset[0].fun).toEqual({ Fungible: '1000' })
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

  it('should default to Version.V4 when version is not provided', () => {
    const fakeApi = {
      callTxMethod: vi.fn().mockReturnValue('defaultResult')
    }
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
    const weight = {
      refTime: 500n,
      proofSize: 600n
    }
    const executionFee = 100n

    const result = createExecuteXcm(input, weight, executionFee)
    expect(result).toBe('defaultResult')
    expect(vi.mocked(createVersionedDestination)).toHaveBeenCalledWith(
      input.scenario,
      Version.V4,
      input.destination,
      input.paraIdTo
    )
    expect(createVersionedBeneficiary).toHaveBeenCalledWith({
      api: input.api,
      scenario: input.scenario,
      pallet: 'PolkadotXcm',
      recipientAddress: input.address,
      version: Version.V4,
      paraId: input.paraIdTo
    })
  })
})
