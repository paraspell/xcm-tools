import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api'
import { AMOUNT_ALL, MIN_AMOUNT } from '../constants'
import { getTransferableAmountInternal } from '../transfer'
import type { TTransferBaseOptions } from '../types'
import { executeWithSwap } from '../utils'
import type { GeneralBuilder } from './Builder'
import { normalizeAmountAll } from './normalizeAmountAll'

vi.mock('../transfer')
vi.mock('../utils/swap', async importOriginal => ({
  ...(await importOriginal()),
  executeWithSwap: vi.fn()
}))

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>

const createOptions = (
  overrides: Partial<TTransferBaseOptions<unknown, unknown, unknown>> = {}
): TTransferBaseOptions<unknown, unknown, unknown> => ({
  from: 'Acala',
  to: 'Hydration',
  recipient: 'address',
  currency: { symbol: 'ACA', amount: 100n },
  sender: 'sender',
  ...overrides
})

describe('normalizeAmountAll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('returns original options when currency amount is not AMOUNT_ALL', async () => {
    const buildTx = vi.fn()
    const createTxFactory = vi.fn(() => buildTx)
    const currencyMock = vi.fn()

    const builder = {
      currency: currencyMock,
      createTxFactory
    } as unknown as GeneralBuilder<
      unknown,
      unknown,
      unknown,
      TTransferBaseOptions<unknown, unknown, unknown>
    >

    const options = createOptions()

    const result = await normalizeAmountAll(mockApi, builder, options)

    expect(currencyMock).not.toHaveBeenCalled()
    expect(createTxFactory).toHaveBeenCalledTimes(1)
    expect(result.buildTx).toBe(buildTx)
    expect(result.options).toMatchObject({
      ...options,
      api: mockApi,
      isAmountAll: false
    })
    expect(result.options.currency).toBe(options.currency)
  })

  it('resolves transferable amount when currency amount is AMOUNT_ALL', async () => {
    const transferable = 123n
    const initialBuildTx = vi.fn()
    const finalBuildTx = vi.fn()

    const getTransferableAmountInternalMock = vi.mocked(getTransferableAmountInternal)
    getTransferableAmountInternalMock.mockResolvedValue(transferable)

    const createTxFactory = vi.fn()
    const currencyMock = vi
      .fn()
      .mockImplementationOnce(() => ({ createTxFactory: vi.fn(() => initialBuildTx) }))
      .mockImplementationOnce(() => ({ createTxFactory: vi.fn(() => finalBuildTx) }))

    const builder = {
      currency: currencyMock,
      createTxFactory
    } as unknown as GeneralBuilder<
      unknown,
      unknown,
      unknown,
      TTransferBaseOptions<unknown, unknown, unknown>
    >

    const options = createOptions({
      currency: { symbol: 'ACA', amount: AMOUNT_ALL },
      feeAsset: { symbol: 'DOT' }
    })

    const result = await normalizeAmountAll(mockApi, builder, options)

    expect(createTxFactory).not.toHaveBeenCalled()
    expect(currencyMock).toHaveBeenNthCalledWith(1, {
      ...(options.currency as Record<string, unknown>),
      amount: MIN_AMOUNT
    })
    expect(currencyMock).toHaveBeenNthCalledWith(2, {
      ...(options.currency as Record<string, unknown>),
      amount: transferable
    })
    expect(getTransferableAmountInternalMock).toHaveBeenCalledWith({
      api: mockApi,
      buildTx: initialBuildTx,
      origin: options.from,
      destination: options.to,
      sender: options.sender,
      feeAsset: options.feeAsset,
      currency: {
        ...(options.currency as Record<string, unknown>),
        amount: MIN_AMOUNT
      }
    })
    expect(result.buildTx).toBe(finalBuildTx)
    expect(result.options.isAmountAll).toBe(true)
    expect(Array.isArray(result.options.currency)).toBe(false)
    if (Array.isArray(result.options.currency)) throw new Error('Expected single asset currency')
    expect(result.options.currency.amount).toBe(transferable)
    expect(result.options.currency).not.toBe(options.currency)
  })

  it('uses executeWithSwap when swapOptions is provided and amount is AMOUNT_ALL', async () => {
    const transferable = 456n
    const initialBuildTx = vi.fn()
    const finalBuildTx = vi.fn()

    const swapOptions = {
      currencyTo: { symbol: 'DOT' },
      exchange: undefined,
      slippage: 1
    }

    vi.mocked(executeWithSwap).mockImplementation(async (_opts, executor) => {
      const routerBuilder = {
        getTransferableAmount: vi.fn<() => Promise<bigint>>().mockResolvedValue(transferable)
      }
      return executor(routerBuilder as never)
    })

    const createTxFactory = vi.fn()
    const currencyMock = vi
      .fn()
      .mockImplementationOnce(() => ({ createTxFactory: vi.fn(() => initialBuildTx) }))
      .mockImplementationOnce(() => ({ createTxFactory: vi.fn(() => finalBuildTx) }))

    const builder = {
      currency: currencyMock,
      createTxFactory
    } as unknown as GeneralBuilder<
      unknown,
      unknown,
      unknown,
      TTransferBaseOptions<unknown, unknown, unknown>
    >

    const options = createOptions({
      currency: { symbol: 'ACA', amount: AMOUNT_ALL },
      swapOptions
    })

    const result = await normalizeAmountAll(mockApi, builder, options)

    expect(executeWithSwap).toHaveBeenCalledWith(
      expect.objectContaining({ api: mockApi, swapOptions }),
      expect.any(Function)
    )
    expect(getTransferableAmountInternal).not.toHaveBeenCalled()
    expect(result.buildTx).toBe(finalBuildTx)
    expect(result.options.isAmountAll).toBe(true)
    expect(Array.isArray(result.options.currency)).toBe(false)
    if (Array.isArray(result.options.currency)) throw new Error('Expected single asset currency')
    expect(result.options.currency.amount).toBe(transferable)
  })
})
