import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import * as assetsModule from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api/IPolkadotApi'
import * as balanceModule from '../../balance'
import * as BuilderModule from '../../builder'
import * as utilsModule from '../../utils'
import { getOriginFeeDetails } from './getOriginFeeDetails'

const apiMock = {
  init: vi.fn(),
  calculateTransactionFee: vi.fn().mockResolvedValue(1000000000n),
  disconnect: vi.fn(),
  setDisconnectAllowed: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

describe('getOriginFeeDetails', () => {
  it('should return correct origin fee details', async () => {
    const originChain = {} as TSubstrateChain
    const destinationChain = {} as TChain
    const currency = {} as WithAmount<TCurrencyCore>
    const account = 'account-address'

    const nativeBalance = 1000000000000000n
    const ed = 1000000000000n
    const xcmFee = 1000000000n

    vi.spyOn(balanceModule, 'getBalanceNative').mockResolvedValue(nativeBalance)
    vi.spyOn(assetsModule, 'getExistentialDeposit').mockReturnValue(ed)
    vi.spyOn(utilsModule, 'createChainClient').mockResolvedValue({})

    const mockTx = {
      paymentInfo: vi.fn().mockResolvedValue({
        partialFee: {
          toBn: () => ({
            toString: () => xcmFee
          })
        }
      })
    }

    const mockBuilderInstance = {
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      amount: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      senderAddress: vi.fn().mockReturnThis(),
      ahAddress: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      buildInternal: vi.fn().mockResolvedValue(mockTx)
    } as unknown as BuilderModule.GeneralBuilder<unknown, unknown>

    vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)

    const result = await getOriginFeeDetails({
      origin: originChain,
      destination: destinationChain,
      currency,
      account,
      accountDestination: account,
      api: apiMock
    })

    expect(result).toEqual({
      sufficientForXCM: true,
      xcmFee
    })
  })

  it('should return correct origin fee details when origin is a relay chain', async () => {
    const originChain = 'Polkadot' as TSubstrateChain
    const destinationChain = {} as TChain
    const currency = {} as WithAmount<TCurrencyCore>
    const account = 'account-address'

    const nativeBalance = 1000000000000000n
    const ed = 1000000000000n
    const xcmFee = 1000000000n

    vi.spyOn(balanceModule, 'getBalanceNative').mockResolvedValue(nativeBalance)
    vi.spyOn(assetsModule, 'getExistentialDeposit').mockReturnValue(ed)
    vi.spyOn(utilsModule, 'createChainClient').mockResolvedValue({})

    const mockTx = {
      paymentInfo: vi.fn().mockResolvedValue({
        partialFee: {
          toBn: () => ({
            toString: () => xcmFee
          })
        }
      })
    }

    const mockBuilderInstance = {
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      amount: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      senderAddress: vi.fn().mockReturnThis(),
      ahAddress: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      buildInternal: vi.fn().mockResolvedValue(mockTx)
    } as unknown as BuilderModule.GeneralBuilder<unknown, unknown>

    vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)

    const result = await getOriginFeeDetails<unknown, unknown>({
      origin: originChain,
      destination: destinationChain,
      currency,
      account,
      accountDestination: account,
      api: apiMock
    })

    expect(result).toEqual({
      sufficientForXCM: true,
      xcmFee: BigInt(xcmFee)
    })
  })

  it('should return correct origin fee details when destination is a relay chain', async () => {
    const originChain = {} as TSubstrateChain
    const destinationChain = 'Polkadot' as TChain
    const currency = {} as WithAmount<TCurrencyCore>
    const account = 'account-address'

    const nativeBalance = 1000000000000000n
    const ed = 1000000000000n
    const xcmFee = '1000000000'

    vi.spyOn(balanceModule, 'getBalanceNative').mockResolvedValue(nativeBalance)
    vi.spyOn(assetsModule, 'getExistentialDeposit').mockReturnValue(ed)
    vi.spyOn(utilsModule, 'createChainClient').mockResolvedValue({})

    const mockTx = {
      paymentInfo: vi.fn().mockResolvedValue({
        partialFee: {
          toBn: () => ({
            toString: () => xcmFee
          })
        }
      })
    }

    const mockBuilderInstance = {
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      amount: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      senderAddress: vi.fn().mockReturnThis(),
      ahAddress: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      buildInternal: vi.fn().mockResolvedValue(mockTx)
    } as unknown as BuilderModule.GeneralBuilder<unknown, unknown>

    vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)

    const result = await getOriginFeeDetails({
      origin: originChain,
      destination: destinationChain,
      currency,
      account,
      accountDestination: account,
      api: apiMock
    })

    expect(result).toEqual({
      sufficientForXCM: true,
      xcmFee: BigInt(xcmFee)
    })
  })
})
