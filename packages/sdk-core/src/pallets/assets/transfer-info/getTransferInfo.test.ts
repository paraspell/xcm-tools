/* eslint-disable @typescript-eslint/unbound-method */
import type { TAsset } from '@paraspell/assets'
import {
  findAssetOnDestOrThrow,
  getExistentialDeposit,
  getNativeAssetSymbol,
  getRelayChainSymbol
} from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { InvalidParameterError } from '../../../errors'
import { getXcmFee } from '../../../transfer'
import type { TGetTransferInfoOptions, TGetXcmFeeResult } from '../../../types'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'
import { getTransferInfo } from './getTransferInfo'

vi.mock('@paraspell/assets', () => ({
  findAssetOnDestOrThrow: vi.fn(),
  getExistentialDeposit: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  getRelayChainSymbol: vi.fn()
}))

vi.mock('../../../transfer', () => ({
  getXcmFee: vi.fn()
}))

vi.mock('../balance', () => ({
  getAssetBalanceInternal: vi.fn(),
  getBalanceNativeInternal: vi.fn()
}))

const mockApiInstance = {
  init: vi.fn().mockResolvedValue(undefined),
  setDisconnectAllowed: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined)
} as unknown as IPolkadotApi<unknown, unknown>

const mockDestApiInstance = {
  init: vi.fn().mockResolvedValue(undefined),
  setDisconnectAllowed: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined)
} as unknown as IPolkadotApi<unknown, unknown>

const mockApi = {
  ...mockApiInstance,
  clone: vi.fn().mockReturnValue(mockDestApiInstance)
} as unknown as IPolkadotApi<unknown, unknown>

describe('getTransferInfo', () => {
  const mockTx = {} as unknown
  const mockOriginNode = 'OriginNode' as TNodeDotKsmWithRelayChains
  const mockDestinationNode = 'DestinationNode' as TNodeDotKsmWithRelayChains
  const mockSenderAddress = 'senderAddress123'
  const mockRecipientAddress = 'recipientAddress456'
  const mockCurrency = { symbol: 'DOT', amount: '1000000000000' } // 100 DOT
  const mockAsset = { symbol: 'DOT', decimals: 10 } as TAsset

  const defaultOptions = {
    api: mockApi,
    tx: mockTx,
    origin: mockOriginNode,
    destination: mockDestinationNode,
    senderAddress: mockSenderAddress,
    address: mockRecipientAddress,
    currency: mockCurrency
  } as TGetTransferInfoOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()

    vi.spyOn(mockApi, 'init').mockResolvedValue(undefined)
    vi.spyOn(mockApi, 'disconnect').mockResolvedValue(undefined)
    vi.spyOn(mockApi, 'clone').mockReturnValue(mockDestApiInstance)

    vi.spyOn(mockDestApiInstance, 'init').mockResolvedValue(undefined)
    vi.spyOn(mockDestApiInstance, 'disconnect').mockResolvedValue(undefined)

    vi.mocked(getBalanceNativeInternal)
      .mockResolvedValueOnce(BigInt('500000000000')) // 50 DOT
      .mockResolvedValueOnce(BigInt('200000000000')) // 20 DOT
    vi.mocked(getAssetBalanceInternal)
      .mockResolvedValueOnce(BigInt('2000000000000')) // 200 DOT
      .mockResolvedValueOnce(BigInt('50000000000')) // 5 DOT
    vi.mocked(getExistentialDeposit)
      .mockReturnValueOnce('10000000000') // 1 DOT
      .mockReturnValueOnce('10000000000') // 1 DOT
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: BigInt('1000000000'), currency: 'ORIGIN_NATIVE' }, // 0.1 DOT
      destination: { fee: BigInt('500000000'), currency: 'DOT' } // 0.05 DOT
    } as TGetXcmFeeResult)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(mockAsset)
    vi.mocked(getNativeAssetSymbol).mockImplementation(node =>
      node === mockOriginNode ? 'ORIGIN_NATIVE' : 'DEST_NATIVE'
    )
    vi.mocked(getRelayChainSymbol).mockReturnValue('DOT')
  })

  it('should correctly retrieve transfer info when dest fee is in transfer currency', async () => {
    const result = await getTransferInfo(defaultOptions)

    expect(mockApi.init).toHaveBeenCalledWith(mockOriginNode)
    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(false)
    expect(mockApi.clone).toHaveBeenCalled()
    expect(mockDestApiInstance.init).toHaveBeenCalledWith(mockDestinationNode)
    expect(mockDestApiInstance.setDisconnectAllowed).toHaveBeenCalledWith(false)

    expect(result.chain.origin).toBe(mockOriginNode)
    expect(result.chain.destination).toBe(mockDestinationNode)
    expect(result.chain.ecosystem).toBe('DOT')

    expect(result.origin.selectedCurrency.balance).toBe(BigInt('2000000000000'))
    expect(result.origin.selectedCurrency.balanceAfter).toBe(BigInt('1000000000000')) // 200 - 100
    expect(result.origin.selectedCurrency.sufficient).toBe(true) // 200 > 1
    expect(result.origin.selectedCurrency.currencySymbol).toBe('DOT')
    expect(result.origin.selectedCurrency.existentialDeposit).toBe(BigInt('10000000000'))

    expect(result.origin.xcmFee.balance).toBe(BigInt('500000000000'))
    expect(result.origin.xcmFee.fee).toBe(BigInt('1000000000'))
    expect(result.origin.xcmFee.balanceAfter).toBe(BigInt('499000000000')) // 50 - 0.1
    expect(result.origin.xcmFee.sufficient).toBe(true) // 50 > 0.1
    expect(result.origin.xcmFee.currencySymbol).toBe('ORIGIN_NATIVE')

    expect(vi.mocked(getNativeAssetSymbol)).toHaveBeenCalledWith(mockDestinationNode)
    expect(vi.mocked(getBalanceNativeInternal)).toHaveBeenCalledTimes(1)

    expect(result.destination.receivedCurrency.balance).toBe(BigInt('50000000000')) // 5 DOT
    // balanceAfter = 5 - 0.05 (destFee) + 100 (amount) = 104.95 DOT
    expect(result.destination.receivedCurrency.balanceAfter).toBe(BigInt('1049500000000'))
    expect(result.destination.receivedCurrency.currencySymbol).toBe('DOT')
    expect(result.destination.receivedCurrency.existentialDeposit).toBe(BigInt('10000000000'))
    // sufficient: amount (100) - destFee (0.05) > (balance (5) < edDest (1) ? edDest (1) : 0)
    // 99.95 > 0 -> true  (since balance 5 > edDest 1, the ? edDest part evaluates to 0)
    expect(result.destination.receivedCurrency.sufficient).toBe(true)

    expect(result.destination.xcmFee.fee).toBe(BigInt('500000000'))
    expect(result.destination.xcmFee.balance).toBe(BigInt('50000000000')) // same as destBalance

    expect(result.destination.xcmFee.balanceAfter).toBe(BigInt('1049500000000'))
    expect(result.destination.xcmFee.currencySymbol).toBe('DOT')

    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockApi.disconnect).toHaveBeenCalled()
    expect(mockDestApiInstance.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockDestApiInstance.disconnect).toHaveBeenCalled()
  })

  it('should correctly retrieve transfer info when dest fee is in native currency of destination', async () => {
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: 1000000000n, currency: 'ORIGIN_NATIVE' },
      destination: { fee: 200000000n, currency: 'DEST_NATIVE' }
    } as TGetXcmFeeResult)
    vi.mocked(getBalanceNativeInternal).mockReset()
    vi.mocked(getBalanceNativeInternal)
      .mockResolvedValueOnce(500000000000n)
      .mockResolvedValueOnce(200000000000n)

    const result = await getTransferInfo(defaultOptions)

    expect(mockApi.init).toHaveBeenCalledWith(mockOriginNode)
    expect(mockDestApiInstance.init).toHaveBeenCalledWith(mockDestinationNode)

    expect(vi.mocked(getNativeAssetSymbol)).toHaveBeenCalledWith(mockDestinationNode)
    expect(vi.mocked(getBalanceNativeInternal)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(getBalanceNativeInternal)).toHaveBeenNthCalledWith(2, {
      address: mockRecipientAddress,
      node: mockDestinationNode,
      api: mockDestApiInstance
    })
    expect(result.destination.receivedCurrency.sufficient).toBeInstanceOf(Error)
    expect((result.destination.receivedCurrency.sufficient as Error).message).toContain(
      'Unable to compute if dest balance will be sufficient. Fee currency is not the same'
    )

    expect(result.destination.receivedCurrency.balanceAfter).toBeInstanceOf(Error)
    expect((result.destination.receivedCurrency.balanceAfter as Error).message).toContain(
      'Unable to compute if dest balance will be sufficient. Fee currency is not the same'
    )

    expect(result.destination.xcmFee.fee).toBe(BigInt('200000000')) // 0.02 DOT
    expect(result.destination.xcmFee.balance).toBe(BigInt('200000000000')) // 20 DOT
    // balanceAfter = destXcmFeeBalance (20) - destFee (0.02) + (destFeeCurrency === asset.symbol ? amount : 0)
    // = 20 - 0.02 + 0 = 19.98 DEST_NATIVE
    expect(result.destination.xcmFee.balanceAfter).toBe(BigInt('199800000000'))
    expect(result.destination.xcmFee.currencySymbol).toBe('DEST_NATIVE')

    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockApi.disconnect).toHaveBeenCalled()
    expect(mockDestApiInstance.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockDestApiInstance.disconnect).toHaveBeenCalled()
  })

  it('should throw InvalidParameterError if edOrigin is not found', async () => {
    vi.mocked(getExistentialDeposit).mockReset().mockReturnValueOnce(null)

    await expect(getTransferInfo(defaultOptions)).rejects.toThrow(InvalidParameterError)
    await expect(getTransferInfo(defaultOptions)).rejects.toThrow(
      `Existential deposit not found for ${mockOriginNode} with currency ${JSON.stringify(mockCurrency)}`
    )

    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockApi.disconnect).toHaveBeenCalled()
    expect(mockDestApiInstance.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockDestApiInstance.disconnect).toHaveBeenCalled()
  })

  it('should throw InvalidParameterError if edDest is not found', async () => {
    vi.mocked(getExistentialDeposit).mockReset().mockReturnValueOnce(null)
    vi.mocked(getExistentialDeposit).mockReturnValueOnce('10000000000').mockReturnValueOnce(null)

    await expect(getTransferInfo(defaultOptions)).rejects.toThrow(InvalidParameterError)
    await expect(getTransferInfo(defaultOptions)).rejects.toThrow(
      `Existential deposit not found for ${mockDestinationNode} with currency ${JSON.stringify(mockCurrency)}`
    )
    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(true)
  })

  it('should throw Error if originFee is undefined', async () => {
    vi.mocked(getExistentialDeposit)
      .mockReturnValueOnce('10000000000') // 1 DOT
      .mockReturnValueOnce('10000000000') // 1 DOT
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: undefined, currency: 'ORIGIN_NATIVE' },
      destination: { fee: BigInt('500000000'), currency: 'DOT' }
    } as TGetXcmFeeResult)

    await expect(getTransferInfo(defaultOptions)).rejects.toThrow(Error)
    await expect(getTransferInfo(defaultOptions)).rejects.toThrow(
      `Cannot get origin xcm fee for currency ${JSON.stringify(mockCurrency)} on node ${mockOriginNode}.`
    )
    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(true)
  })

  it('should handle case where destFee is undefined (though type implies it is bigint)', async () => {
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: BigInt('1000000000'), currency: 'ORIGIN_NATIVE' },
      destination: { fee: undefined, currency: 'DOT' }
    } as TGetXcmFeeResult)

    await expect(getTransferInfo(defaultOptions)).rejects.toThrow(TypeError)

    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockApi.disconnect).toHaveBeenCalled()
    expect(mockDestApiInstance.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockDestApiInstance.disconnect).toHaveBeenCalled()
  })

  it('should correctly call disconnects in finally block even if an early error occurs in try', async () => {
    vi.mocked(getExistentialDeposit)
      .mockReturnValueOnce('10000000000') // 1 DOT
      .mockReturnValueOnce('10000000000') // 1 DOT

    const earlyError = new Error('Early API error')
    vi.mocked(getBalanceNativeInternal).mockReset().mockRejectedValueOnce(earlyError)

    await expect(getTransferInfo(defaultOptions)).rejects.toThrow(earlyError)

    expect(mockApi.init).toHaveBeenCalled()
    expect(mockDestApiInstance.init).toHaveBeenCalled()

    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(false)
    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockApi.disconnect).toHaveBeenCalledTimes(1)

    expect(mockDestApiInstance.setDisconnectAllowed).toHaveBeenCalledWith(false)
    expect(mockDestApiInstance.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockDestApiInstance.disconnect).toHaveBeenCalledTimes(1)
  })
})
