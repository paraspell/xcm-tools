import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import type { TVerifyEdOnDestinationOptions } from '../../../types'
import * as utils from '../../../utils'
import * as balanceModule from '../balance/getAssetBalance'
import * as existentialModule from '../getExistentialDeposit'
import { verifyEdOnDestination } from './verifyEdOnDestination'
import * as internal from './verifyEdOnDestinationInternal'

describe('verifyEdOnDestinationInternal', () => {
  const dummyNode = {}
  const dummyAddress = 'dummy-address'
  const dummyApi = { disconnect: vi.fn() } as unknown as IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return true when balance + amountWithoutFee - ed > 0', async () => {
    const currency = { symbol: 'DOT', amount: '1000' }
    vi.spyOn(utils, 'validateAddress').mockImplementation(() => {})
    vi.spyOn(existentialModule, 'getExistentialDeposit').mockReturnValue('50')
    vi.spyOn(balanceModule, 'getAssetBalanceInternal').mockResolvedValue(20n)

    const options = {
      api: dummyApi,
      node: dummyNode,
      address: dummyAddress,
      currency
    } as TVerifyEdOnDestinationOptions<unknown, unknown>

    const result = await internal.verifyEdOnDestinationInternal(options)

    expect(result).toBe(true)
    expect(utils.validateAddress).toHaveBeenCalledWith(dummyAddress, dummyNode)
  })

  it('should return false when balance + amountWithoutFee - ed <= 0', async () => {
    const currency = { symbol: 'DOT', amount: '100' }
    vi.spyOn(utils, 'validateAddress').mockImplementation(() => {})
    vi.spyOn(existentialModule, 'getExistentialDeposit').mockReturnValue('100')
    vi.spyOn(balanceModule, 'getAssetBalanceInternal').mockResolvedValue(0n)

    const options = {
      api: dummyApi,
      node: dummyNode,
      address: dummyAddress,
      currency
    } as TVerifyEdOnDestinationOptions<unknown, unknown>

    const result = await internal.verifyEdOnDestinationInternal(options)

    expect(result).toBe(false)
  })

  it('should throw an error when getExistentialDeposit returns null', async () => {
    const currency = { symbol: 'DOT', amount: '1000' }
    vi.spyOn(utils, 'validateAddress').mockImplementation(() => {})
    vi.spyOn(existentialModule, 'getExistentialDeposit').mockReturnValue(null)

    const options = {
      api: dummyApi,
      node: dummyNode,
      address: dummyAddress,
      currency
    } as TVerifyEdOnDestinationOptions<unknown, unknown>

    await expect(internal.verifyEdOnDestinationInternal(options)).rejects.toThrow(
      /Cannot get existential deposit for currency/
    )
  })
})

describe('verifyEdOnDestination', () => {
  const dummyNode = 'Acala'
  const dummyAddress = 'dummy-address'
  let disconnectSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.restoreAllMocks()
    disconnectSpy = vi.fn().mockResolvedValue(undefined)
  })

  it('should return the internal result and call disconnect on success', async () => {
    const currency = { symbol: 'DOT', amount: '1000' }
    const dummyApi = { disconnect: disconnectSpy } as unknown as IPolkadotApi<unknown, unknown>
    const options = {
      api: dummyApi,
      node: dummyNode,
      address: dummyAddress,
      currency
    } as TVerifyEdOnDestinationOptions<unknown, unknown>

    const spy = vi.spyOn(internal, 'verifyEdOnDestinationInternal').mockResolvedValue(true)

    const result = await verifyEdOnDestination(options)

    expect(result).toBe(true)
    expect(spy).toHaveBeenCalledWith(options)
    expect(disconnectSpy).toHaveBeenCalled()
  })

  it('should call disconnect even if verifyEdOnDestinationInternal throws an error', async () => {
    const currency = { symbol: 'DOT', amount: '1000' }
    const dummyApi = { disconnect: disconnectSpy } as unknown as IPolkadotApi<unknown, unknown>
    const options = {
      api: dummyApi,
      node: dummyNode,
      address: dummyAddress,
      currency
    } as TVerifyEdOnDestinationOptions<unknown, unknown>
    const error = new Error('Internal error')
    vi.spyOn(internal, 'verifyEdOnDestinationInternal').mockRejectedValue(error)

    await expect(verifyEdOnDestination(options)).rejects.toThrow('Internal error')
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
