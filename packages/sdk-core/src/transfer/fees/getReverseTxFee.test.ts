import { isChainEvm } from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { isAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { Builder } from '../../builder'
import type { TGetReverseTxFeeOptions } from '../../types'
import { padFee } from '../../utils/fees'
import { getReverseTxFee } from './getReverseTxFee'

vi.mock('@paraspell/assets', () => ({
  isChainEvm: vi.fn(),
  InvalidCurrencyError: class InvalidCurrencyError extends Error {}
}))

vi.mock('viem')
vi.mock('../../utils/fees')

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
    buildInternal: mockBuild
  }))
}))

vi.mock('./padFee')

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
    origin: 'ParachainA' as TSubstrateChain,
    destination: 'ParachainB' as TSubstrateChain,
    senderAddress: 'senderAlice',
    address: '0x1234567890123456789012345678901234567890',
    currency: { symbol: 'DOT', amount: mockAmount }
  } as TGetReverseTxFeeOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isChainEvm).mockReturnValue(false)

    vi.mocked(isAddress).mockImplementation((addr: string) => addr.startsWith('0x'))

    mockBuild.mockResolvedValue({ tx: mockTxObject, options: {} as never })
    mockCalculateTransactionFee.mockResolvedValue(rawFee)
    vi.mocked(padFee).mockReturnValue(paddedFee)
  })

  it('should correctly call Builder with flipped origin/destination for Substrate chains', async () => {
    const currencyInput = { symbol: 'TOKEN', amount: mockAmount }
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

  it('should correctly call Builder with currencyInput as location', async () => {
    const currencyInput = {
      location: { parents: 1, interior: 'Here' } as TLocation,
      amount: mockAmount
    }
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
    const currencyInput = { symbol: 'TOKEN', amount: mockAmount }
    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(
      mockTxObject,
      defaultOptions.senderAddress
    )
  })

  it('should call padFee with the raw fee and correct parameters', async () => {
    const currencyInput = { symbol: 'TOKEN', amount: mockAmount }
    await getReverseTxFee(defaultOptions, currencyInput)

    expect(padFee).toHaveBeenCalledWith(
      rawFee,
      defaultOptions.origin,
      defaultOptions.destination,
      'destination'
    )
  })

  it('should return the padded fee on successful execution', async () => {
    const currencyInput = { symbol: 'TOKEN', amount: mockAmount }
    const result = await getReverseTxFee(defaultOptions, currencyInput)

    expect(result).toBe(paddedFee)
  })

  it('should handle different currency amounts correctly', async () => {
    const amount = 5000000000n

    const optionsWithDifferentAmount = {
      ...defaultOptions,
      currency: { symbol: 'DOT', amount }
    }
    const currencyInput = { symbol: 'TOKEN', amount }
    const expectedCurrencyArg = {
      ...currencyInput,
      amount: optionsWithDifferentAmount.currency.amount
    }

    await getReverseTxFee(optionsWithDifferentAmount, currencyInput)

    expect(mockCurrency).toHaveBeenCalledWith(expectedCurrencyArg)
  })

  it('should use EVM address when origin chain is EVM', async () => {
    vi.mocked(isChainEvm).mockImplementation(chain => chain === defaultOptions.origin)
    const currencyInput = { symbol: 'TOKEN', amount: mockAmount }

    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(
      mockTxObject,
      defaultOptions.senderAddress
    )
  })

  it('should use EVM address when destination chain is EVM', async () => {
    vi.mocked(isChainEvm).mockImplementation(chain => chain === defaultOptions.destination)
    const currencyInput = { symbol: 'TOKEN', amount: mockAmount }

    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(mockTxObject, defaultOptions.address)
  })

  it('should use correct addresses when both chains are EVM', async () => {
    vi.mocked(isChainEvm).mockReturnValue(true)
    const currencyInput = { symbol: 'TOKEN', amount: mockAmount }

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
    const currencyInput = { symbol: 'TOKEN', amount: mockAmount }

    await getReverseTxFee(optionsWithNonEvmAddress, currencyInput)

    expect(mockAddress).toHaveBeenCalledWith(optionsWithNonEvmAddress.address)
    expect(mockSenderAddress).toHaveBeenCalledWith(optionsWithNonEvmAddress.address)
  })

  it('should handle EVM to Substrate scenario correctly', async () => {
    vi.mocked(isChainEvm).mockImplementation(chain => chain === defaultOptions.destination)
    const currencyInput = { symbol: 'TOKEN', amount: mockAmount }

    await getReverseTxFee(defaultOptions, currencyInput)

    expect(mockAddress).toHaveBeenCalledWith(defaultOptions.senderAddress)
    expect(mockSenderAddress).toHaveBeenCalledWith(defaultOptions.address)
    expect(mockCalculateTransactionFee).toHaveBeenCalledWith(mockTxObject, defaultOptions.address)
  })
})
