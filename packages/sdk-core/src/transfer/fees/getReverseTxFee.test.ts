import type { TCurrencyInput } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { Builder } from '../../builder'
import type { TGetFeeForDestNodeOptions } from '../../types'
import { getReverseTxFee } from './getReverseTxFee'
import { padFee } from './padFee'

const mockBuild = vi.fn()
const mockCurrency = vi.fn().mockReturnThis()
const mockSenderAddress = vi.fn().mockReturnThis()
const mockAddress = vi.fn().mockReturnThis()
const mockTo = vi.fn().mockReturnThis()
const mockFrom = vi.fn().mockReturnThis()

vi.mock('../../builder', () => ({
  Builder: vi.fn(() => ({
    from: mockFrom,
    to: mockTo,
    address: mockAddress,
    senderAddress: mockSenderAddress,
    currency: mockCurrency,
    build: mockBuild
  }))
}))

vi.mock('./padFee', () => ({
  padFee: vi.fn()
}))

const mockCalculateTransactionFee = vi.fn()
const mockApi = {
  calculateTransactionFee: mockCalculateTransactionFee
} as unknown as IPolkadotApi<unknown, unknown>

describe('getReverseTxFee', () => {
  const mockTxObject = { type: 'mockTransaction' }
  const rawFee = 100000n
  const paddedFee = 120000n

  const mockAmount = 10000000000n

  const defaultOptions = {
    api: mockApi,
    origin: 'ParachainA' as TNodeDotKsmWithRelayChains,
    destination: 'ParachainB' as TNodeDotKsmWithRelayChains,
    senderAddress: 'senderAlice',
    address: 'receiverBob',
    currency: { symbol: 'DOT', amount: mockAmount }
  } as TGetFeeForDestNodeOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    mockBuild.mockResolvedValue(mockTxObject)
    mockCalculateTransactionFee.mockResolvedValue(rawFee)
    vi.mocked(padFee).mockReturnValue(paddedFee)
  })

  it('should throw InvalidCurrencyError if currency is a multiasset', async () => {
    const optionsWithMultiAsset = {
      ...defaultOptions,
      currency: { multiasset: [], amount: '100' }
    }
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }

    await expect(getReverseTxFee(optionsWithMultiAsset, currencyInput)).rejects.toThrow(
      InvalidCurrencyError
    )
    await expect(getReverseTxFee(optionsWithMultiAsset, currencyInput)).rejects.toThrow(
      'Multi-assets are not yet supported for XCM fee calculation.'
    )

    expect(Builder).not.toHaveBeenCalled()
  })

  it('should correctly call Builder with flipped origin/destination and addresses for fee estimation', async () => {
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }
    const expectedCurrencyArg = {
      ...currencyInput,
      amount: mockAmount
    }

    await getReverseTxFee(defaultOptions, currencyInput)

    expect(Builder).toHaveBeenCalledWith(mockApi)
    expect(mockFrom).toHaveBeenCalledWith(defaultOptions.destination)
    expect(mockTo).toHaveBeenCalledWith(defaultOptions.origin)
    expect(mockAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockCurrency).toHaveBeenCalledWith(expectedCurrencyArg)
    expect(mockBuild).toHaveBeenCalled()
  })

  it('should correctly call Builder with currencyInput as multilocation', async () => {
    const currencyInput: TCurrencyInput = { multilocation: { parents: 1, interior: 'Here' } }
    const expectedCurrencyArg = {
      ...currencyInput,
      amount: mockAmount
    }

    await getReverseTxFee(defaultOptions, currencyInput)

    expect(Builder).toHaveBeenCalledWith(mockApi)
    expect(mockFrom).toHaveBeenCalledWith(defaultOptions.destination)
    expect(mockTo).toHaveBeenCalledWith(defaultOptions.origin)
    expect(mockAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockCurrency).toHaveBeenCalledWith(expectedCurrencyArg)
    expect(mockBuild).toHaveBeenCalled()
  })

  it('should call api.calculateTransactionFee with the built transaction and original recipient address', async () => {
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }
    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(mockTxObject, defaultOptions.address)
  })

  it('should call padFee with the raw fee and correct parameters', async () => {
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }
    await getReverseTxFee(defaultOptions, currencyInput)

    expect(padFee).toHaveBeenCalledWith(
      rawFee,
      defaultOptions.origin,
      defaultOptions.destination,
      'destination'
    )
  })

  it('should return the padded fee on successful execution', async () => {
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }
    const result = await getReverseTxFee(defaultOptions, currencyInput)

    expect(result).toBe(paddedFee)
  })

  it('should handle different currency amounts correctly', async () => {
    const optionsWithDifferentAmount = {
      ...defaultOptions,
      currency: { symbol: 'DOT', amount: '5000000000' }
    }
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }
    const expectedCurrencyArg = {
      ...currencyInput,
      amount: optionsWithDifferentAmount.currency.amount
    }

    await getReverseTxFee(optionsWithDifferentAmount, currencyInput)

    expect(mockCurrency).toHaveBeenCalledWith(expectedCurrencyArg)
  })
})
