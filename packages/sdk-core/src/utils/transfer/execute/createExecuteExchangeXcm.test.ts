/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type TMultiLocation, Version } from '@paraspell/sdk-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDestination } from '../../../pallets/xcmPallet/utils'
import type { TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../../types'
import { assertHasLocation } from '../../assertions'
import { createBeneficiaryLocation, localizeLocation } from '../../location'
import { createExecuteExchangeXcm } from './createExecuteExchangeXcm'

vi.mock('../../../pallets/xcmPallet/utils', () => ({
  createDestination: vi.fn()
}))

vi.mock('../../createBeneficiary', () => ({
  createBeneficiary: vi.fn()
}))

vi.mock('../../location', () => ({
  localizeLocation: vi.fn(),
  createBeneficiaryLocation: vi.fn()
}))

vi.mock('../../assertions')

describe('createExecuteExchangeXcm', () => {
  const mockOrigin = 'Hydration'
  const dummyDest = 'destValue' as unknown as TMultiLocation
  const dummyBeneficiary = 'beneficiaryValue' as unknown as TMultiLocation

  beforeEach(() => {
    vi.mocked(createDestination).mockReturnValue(dummyDest)
    vi.mocked(createBeneficiaryLocation).mockReturnValue(dummyBeneficiary)
    vi.mocked(localizeLocation).mockReturnValue('transformedLocation' as unknown as TMultiLocation)
  })

  afterEach(() => {
    vi.clearAllMocks()
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
      destination: 'dest',
      paraIdTo: 200,
      address: 'address'
    } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>
    const weight = {
      refTime: 123n,
      proofSize: 456n
    }
    const originFee = 50n
    const destFee = 75n

    const result = createExecuteExchangeXcm(input, mockOrigin, weight, originFee, destFee)

    expect(assertHasLocation).toHaveBeenCalledOnce()

    expect(result).toBe('result')
    expect(fakeApi.callTxMethod).toHaveBeenCalledTimes(1)

    const callArg = fakeApi.callTxMethod.mock.calls[0][0] as TSerializedApiCall
    expect(callArg.module).toBe('PolkadotXcm')
    expect(callArg.method).toBe('execute')
    expect(callArg.parameters.max_weight).toEqual({
      ref_time: weight.refTime,
      proof_size: weight.proofSize
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (callArg.parameters.message as Record<string, any>)[Version.V4]
    expect(message).toHaveLength(3)

    // 1. WithdrawAsset
    expect(message[0].WithdrawAsset[0]).toEqual({
      id: 'transformedLocation',
      fun: { Fungible: 1000n }
    })

    // 2. BuyExecution (origin)
    expect(message[1].BuyExecution).toEqual({
      fees: {
        id: 'transformedLocation',
        fun: { Fungible: originFee }
      },
      weight_limit: 'Unlimited'
    })

    // 3. InitiateTeleport
    const teleport = message[2].InitiateTeleport
    expect(teleport.assets).toEqual({ Wild: { AllCounted: 1 } })
    expect(teleport.dest).toBe(dummyDest)
    expect(teleport.xcm).toHaveLength(3)

    // teleport xcm[0]: BuyExecution (dest)
    expect(teleport.xcm[0].BuyExecution).toEqual({
      fees: {
        id: input.asset.multiLocation,
        fun: { Fungible: destFee }
      },
      weight_limit: 'Unlimited'
    })

    // teleport xcm[1]: ExchangeAsset
    expect(teleport.xcm[1].ExchangeAsset).toEqual({
      give: { Wild: { AllCounted: 1 } },
      want: [
        {
          id: expect.anything(), // DOT_MULTILOCATION
          fun: { Fungible: 100000000n }
        }
      ],
      maximal: false
    })

    // teleport xcm[2]: DepositAsset
    expect(teleport.xcm[2].DepositAsset).toEqual({
      assets: { Wild: { AllCounted: 2 } },
      beneficiary: dummyBeneficiary
    })
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
      address: 'address-default',
      version: Version.V4
    } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>
    const weight = {
      refTime: 500n,
      proofSize: 600n
    }
    const originFee = 100n
    const destFee = 200n

    const result = createExecuteExchangeXcm(input, mockOrigin, weight, originFee, destFee)
    expect(result).toBe('defaultResult')
    expect(assertHasLocation).toHaveBeenCalledOnce()
    expect(createDestination).toHaveBeenCalledWith(
      Version.V4,
      mockOrigin,
      input.destination,
      input.paraIdTo
    )
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: input.api,
      address: input.address,
      version: Version.V4
    })
  })
})
