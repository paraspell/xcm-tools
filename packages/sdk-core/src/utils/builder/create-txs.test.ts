/* eslint-disable @typescript-eslint/unbound-method */
import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type { GeneralBuilder } from '../../builder'
import { UnsupportedOperationError } from '../../errors'
import { createTransfer } from '../../transfer'
import type {
  TBuilderConfig,
  TCreateTxsOptions,
  TSubstrateTransferOptions,
  TTransferBaseOptionsWithSender
} from '../../types'
import { assertToIsString } from '../assertions'
import { isConfig } from '../guards'
import { executeWithRouter } from '../swap'
import { parseUnits } from '../unit'
import {
  computeOverridenAmount,
  createTransferOrSwap,
  createTransferOrSwapAll,
  createTxOverrideAmount,
  overrideTxAmount
} from './create-txs'

vi.mock('@paraspell/assets')
vi.mock('../assertions')
vi.mock('../guards')
vi.mock('../unit')
vi.mock('../../transfer')
vi.mock('../swap')

const makeApi = (config: TBuilderConfig<unknown>) =>
  ({
    config
  }) as unknown as PolkadotApi<unknown, unknown, unknown>

const baseOptions = {
  api: makeApi({}),
  from: 'Acala',
  to: 'Hydration',
  sender: 'SENDER',
  address: 'DEST',
  currency: { symbol: 'DOT', amount: '123' }
} as TCreateTxsOptions<unknown, unknown, unknown>

describe('computeOverridenAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds increase (as BigInt) when config.abstractDecimals is true', () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: true }) }
    vi.mocked(isConfig).mockReturnValue(true)

    const out = computeOverridenAmount(options, '100')
    expect(out).toBe(223) // 123 + 100
    expect(assertToIsString).not.toHaveBeenCalled()
    expect(findAssetInfoOrThrow).not.toHaveBeenCalled()
    expect(parseUnits).not.toHaveBeenCalled()
  })

  it('uses findAssetInfoOrThrow + parseUnits (increase) and adds to current amount when abstractDecimals is false', () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: false }) }
    vi.mocked(isConfig).mockReturnValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ decimals: 12 } as TAssetInfo)
    vi.mocked(parseUnits).mockReturnValue(999n)

    const out = computeOverridenAmount(options, '100')
    expect(assertToIsString).toHaveBeenCalledWith('Hydration')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Acala', options.currency, 'Hydration')
    expect(parseUnits).toHaveBeenCalledWith('100', 12)
    expect(out).toBe(1122n) // 999n + 123n
  })

  it('treats non-config objects as supporting abstractDecimals by default', () => {
    const options = { ...baseOptions, api: makeApi({}) }
    vi.mocked(isConfig).mockReturnValue(false)

    const out = computeOverridenAmount(options, '7')
    expect(out).toBe(130) // 123 + 7
    expect(assertToIsString).not.toHaveBeenCalled()
    expect(findAssetInfoOrThrow).not.toHaveBeenCalled()
    expect(parseUnits).not.toHaveBeenCalled()
  })

  it('when relative=false with abstractDecimals=true, ignores existing amount and returns only the increase (number path)', () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: true }) }
    vi.mocked(isConfig).mockReturnValue(true)

    const out = computeOverridenAmount(options, '100', /* relative */ false)
    expect(out).toBe(100) // not 223
    expect(assertToIsString).not.toHaveBeenCalled()
    expect(findAssetInfoOrThrow).not.toHaveBeenCalled()
    expect(parseUnits).not.toHaveBeenCalled()
  })

  it('when relative=false with abstractDecimals=false, ignores existing amount and returns only the parsed increase (bigint path)', () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: false }) }
    vi.mocked(isConfig).mockReturnValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ decimals: 12 } as TAssetInfo)
    vi.mocked(parseUnits).mockReturnValue(999n)

    const out = computeOverridenAmount(options, '100', /* relative */ false)
    expect(assertToIsString).toHaveBeenCalledWith('Hydration')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Acala', options.currency, 'Hydration')
    expect(parseUnits).toHaveBeenCalledWith('100', 12)
    expect(out).toBe(999n) // not 1122n
  })
})

describe('overrideTxAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls builder.currency with overridden SUM(amount + increase) and builds tx', async () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: true }) }
    vi.mocked(isConfig).mockReturnValue(true)

    const builtTx = { kind: 'tx' }
    const builder = {
      currency: vi.fn().mockReturnThis(),
      buildInternal: vi.fn().mockResolvedValue({ tx: builtTx, options: {} })
    } as unknown as GeneralBuilder<
      unknown,
      unknown,
      unknown,
      TTransferBaseOptionsWithSender<unknown, unknown, unknown>
    >

    const out = await overrideTxAmount(options, builder, '50')

    expect(builder.currency).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 173 // 123 + 50
      })
    )
    expect(out).toBe(builtTx)
  })
})

describe('createTx', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('when amount is undefined, builds real tx only (no override)', async () => {
    const realTx = { kind: 'realTx' }
    const builder = {
      currency: vi.fn().mockReturnThis(),
      buildInternal: vi.fn().mockResolvedValue({ tx: realTx, options: {} })
    } as unknown as GeneralBuilder<
      unknown,
      unknown,
      unknown,
      TTransferBaseOptionsWithSender<unknown, unknown, unknown>
    >

    const res = await createTxOverrideAmount(baseOptions, builder, undefined)

    expect(builder['buildInternal']).toHaveBeenCalledTimes(1)
    expect(builder.currency).not.toHaveBeenCalled()
    expect(res).toBe(realTx)
  })

  it('when amount is provided, uses override path and builds once', async () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: true }) }
    vi.mocked(isConfig).mockReturnValue(true)

    const tx = { kind: 'overrideTx' }
    const builder = {
      currency: vi.fn().mockReturnThis(),
      buildInternal: vi.fn().mockResolvedValue({ tx, options: {} })
    } as unknown as GeneralBuilder<
      unknown,
      unknown,
      unknown,
      TTransferBaseOptionsWithSender<unknown, unknown, unknown>
    >

    const res = await createTxOverrideAmount(options, builder, '200')

    expect(builder.currency).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 323 }) // 123 + 200
    )
    expect(builder['buildInternal']).toHaveBeenCalledTimes(1)
    expect(res).toBe(tx)
  })
})

const makeTransferOptions = (
  overrides: Partial<TSubstrateTransferOptions<unknown, unknown, unknown>> = {}
): TSubstrateTransferOptions<unknown, unknown, unknown> =>
  ({
    api: {
      api: 'mockApi',
      config: {}
    },
    from: 'Acala',
    to: 'Hydration',
    sender: 'SENDER',
    recipient: 'DEST',
    currency: { symbol: 'DOT', amount: '100' },
    isAmountAll: false,
    ...overrides
  }) as TSubstrateTransferOptions<unknown, unknown, unknown>

describe('createTransferOrSwapAll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a single TRANSFER context when swapOptions is undefined', async () => {
    const mockTx = { kind: 'transfer' }
    vi.mocked(createTransfer).mockResolvedValue(mockTx)

    const options = makeTransferOptions()
    const result = await createTransferOrSwapAll(options)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      type: 'TRANSFER',
      api: 'mockApi',
      chain: 'Acala',
      tx: mockTx
    })
    expect(createTransfer).toHaveBeenCalledWith(options)
    expect(executeWithRouter).not.toHaveBeenCalled()
  })

  it('delegates to executeWithRouter when swapOptions is provided', async () => {
    const swapTxs = [
      { type: 'SWAP', api: 'api1', chain: 'Acala', tx: 'tx1' },
      { type: 'TRANSFER', api: 'api2', chain: 'Hydration', tx: 'tx2' }
    ]
    vi.mocked(executeWithRouter).mockImplementation(async (_opts, executor) => {
      const fakeBuilder = { build: vi.fn().mockResolvedValue(swapTxs) }
      return executor(fakeBuilder as never)
    })

    const swapOptions = {
      currencyTo: { symbol: 'GLMR' },
      exchange: undefined,
      slippage: 1
    }
    const options = makeTransferOptions({ swapOptions } as never)
    const result = await createTransferOrSwapAll(options)

    expect(result).toEqual(swapTxs)
    expect(executeWithRouter).toHaveBeenCalled()
    expect(createTransfer).not.toHaveBeenCalled()
  })
})

describe('createTransferOrSwap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the single transaction when createTransferOrSwapAll yields one result', async () => {
    const mockTx = { kind: 'singleTx' }
    vi.mocked(createTransfer).mockResolvedValue(mockTx)

    const options = makeTransferOptions()
    const result = await createTransferOrSwap(options)

    expect(result).toBe(mockTx)
  })

  it('throws UnsupportedOperationError when multiple transactions are returned', async () => {
    const multiTxs = [
      { type: 'SWAP', api: 'a1', chain: 'Acala', tx: 'tx1' },
      { type: 'TRANSFER', api: 'a2', chain: 'Hydration', tx: 'tx2' }
    ]
    vi.mocked(executeWithRouter).mockImplementation(async (_opts, executor) => {
      const fakeBuilder = { build: vi.fn().mockResolvedValue(multiTxs) }
      return executor(fakeBuilder as never)
    })

    const swapOptions = {
      currencyTo: { symbol: 'GLMR' },
      exchange: undefined,
      slippage: 1
    }
    const options = makeTransferOptions({ swapOptions } as never)

    await expect(createTransferOrSwap(options)).rejects.toThrow(UnsupportedOperationError)
    await expect(createTransferOrSwap(options)).rejects.toThrow(/Use .buildAll\(\) instead/)
  })
})
