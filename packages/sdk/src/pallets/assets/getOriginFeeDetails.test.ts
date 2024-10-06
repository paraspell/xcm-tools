import { describe, it, expect, vi } from 'vitest'
import * as balanceModule from './balance/getBalanceNative'
import * as depositModule from './getExistentialDeposit'
import * as utilsModule from '../../utils'
import * as BuilderModule from '../../builder'

import type { ApiPromise } from '@polkadot/api'
import type { TCurrencyCore } from '../../types'
import type { TNodeDotKsmWithRelayChains } from '../../types'
import { getOriginFeeDetails } from './getOriginFeeDetails'

describe('getOriginFeeDetails', () => {
  it('should return correct origin fee details', async () => {
    const originNode = {} as TNodeDotKsmWithRelayChains
    const destinationNode = {} as TNodeDotKsmWithRelayChains
    const currency = {} as TCurrencyCore
    const amount = '1000000000000'
    const account = 'account-address'

    const nativeBalance = BigInt('1000000000000000')
    const minTransferableAmount = BigInt('1000000000000')
    const xcmFee = '1000000000'

    vi.spyOn(balanceModule, 'getBalanceNative').mockResolvedValue(nativeBalance)
    vi.spyOn(depositModule, 'getMinNativeTransferableAmount').mockReturnValue(minTransferableAmount)
    vi.spyOn(utilsModule, 'createApiInstanceForNode').mockResolvedValue({} as ApiPromise)

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
      currency: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue(mockTx)
    } as unknown as BuilderModule.GeneralBuilder

    vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await getOriginFeeDetails(originNode, destinationNode, currency, amount, account)

    expect(result).toEqual({
      sufficientForXCM: true,
      xcmFee: BigInt(xcmFee)
    })

    consoleLogSpy.mockRestore()
  })

  it('should return correct origin fee details when origin is a relay chain', async () => {
    const originNode = 'Polkadot' as TNodeDotKsmWithRelayChains
    const destinationNode = {} as TNodeDotKsmWithRelayChains
    const currency = {} as TCurrencyCore
    const amount = '1000000000000'
    const account = 'account-address'

    const nativeBalance = BigInt('1000000000000000')
    const minTransferableAmount = BigInt('1000000000000')
    const xcmFee = '1000000000'

    vi.spyOn(balanceModule, 'getBalanceNative').mockResolvedValue(nativeBalance)
    vi.spyOn(depositModule, 'getMinNativeTransferableAmount').mockReturnValue(minTransferableAmount)
    vi.spyOn(utilsModule, 'createApiInstanceForNode').mockResolvedValue({} as ApiPromise)

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
      currency: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue(mockTx)
    } as unknown as BuilderModule.GeneralBuilder

    vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await getOriginFeeDetails(originNode, destinationNode, currency, amount, account)

    expect(result).toEqual({
      sufficientForXCM: true,
      xcmFee: BigInt(xcmFee)
    })

    consoleLogSpy.mockRestore()
  })

  it('should return correct origin fee details when destination is a relay chain', async () => {
    const originNode = {} as TNodeDotKsmWithRelayChains
    const destinationNode = 'Polkadot' as TNodeDotKsmWithRelayChains
    const currency = {} as TCurrencyCore
    const amount = '1000000000000'
    const account = 'account-address'

    const nativeBalance = BigInt('1000000000000000')
    const minTransferableAmount = BigInt('1000000000000')
    const xcmFee = '1000000000'

    vi.spyOn(balanceModule, 'getBalanceNative').mockResolvedValue(nativeBalance)
    vi.spyOn(depositModule, 'getMinNativeTransferableAmount').mockReturnValue(minTransferableAmount)
    vi.spyOn(utilsModule, 'createApiInstanceForNode').mockResolvedValue({} as ApiPromise)

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
      currency: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue(mockTx)
    } as unknown as BuilderModule.GeneralBuilder

    vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await getOriginFeeDetails(originNode, destinationNode, currency, amount, account)

    expect(result).toEqual({
      sufficientForXCM: true,
      xcmFee: BigInt(xcmFee)
    })

    consoleLogSpy.mockRestore()
  })
})
