import type { TCurrencyInput } from '@paraspell/assets'
import { isNodeEvm } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { isAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { Builder } from '../../builder'
import type { TGetReverseTxFeeOptions } from '../../types'
import { getReverseTxFee } from './getReverseTxFee'
import { padFee } from './padFee'

vi.mock('@paraspell/assets', () => ({
  isNodeEvm: vi.fn(),
  InvalidCurrencyError: class InvalidCurrencyError extends Error {}
}))

vi.mock('viem', () => ({
  isAddress: vi.fn()
}))

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
    address: '0x1234567890123456789012345678901234567890',
    currency: { symbol: 'DOT', amount: mockAmount }
  } as TGetReverseTxFeeOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isNodeEvm).mockReturnValue(false)

    vi.mocked(isAddress).mockImplementation((addr: string) => addr.startsWith('0x'))

    mockBuild.mockResolvedValue(mockTxObject)
    mockCalculateTransactionFee.mockResolvedValue(rawFee)
    vi.mocked(padFee).mockReturnValue(paddedFee)
  })

  it('should correctly call Builder with flipped origin/destination for Substrate chains', async () => {
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
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
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
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
    expect(mockCurrency).toHaveBeenCalledWith(expectedCurrencyArg)
    expect(mockBuild).toHaveBeenCalled()
  })

  it('should call api.calculateTransactionFee with the built transaction and correct sender address', async () => {
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }
    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(
      mockTxObject,
      defaultOptions.senderAddress
    )
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

  it('should use EVM address when origin chain is EVM', async () => {
    vi.mocked(isNodeEvm).mockImplementation(chain => chain === defaultOptions.origin)
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }

    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(
      mockTxObject,
      defaultOptions.senderAddress
    )
  })

  it('should use EVM address when destination chain is EVM', async () => {
    vi.mocked(isNodeEvm).mockImplementation(chain => chain === defaultOptions.destination)
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }

    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(mockTxObject, defaultOptions.address)
  })

  it('should use correct addresses when both chains are EVM', async () => {
    vi.mocked(isNodeEvm).mockReturnValue(true)
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }

    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(mockTxObject, defaultOptions.address)
  })

  it('should handle edge case where address is not EVM format', async () => {
    const optionsWithNonEvmAddress = {
      ...defaultOptions,
      address: 'substrate-style-address'
    }
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }

    await getReverseTxFee(optionsWithNonEvmAddress, currencyInput)

    expect(mockAddress).toHaveBeenCalledWith(optionsWithNonEvmAddress.address)
    expect(mockSenderAddress).toHaveBeenCalledWith(optionsWithNonEvmAddress.address)
  })

  it('should handle EVM to Substrate scenario correctly', async () => {
    vi.mocked(isNodeEvm).mockImplementation(chain => chain === defaultOptions.destination)
    const currencyInput: TCurrencyInput = { symbol: 'TOKEN' }

    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(mockTxObject, defaultOptions.address)
  })
})
