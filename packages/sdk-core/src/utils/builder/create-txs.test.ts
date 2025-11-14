/* eslint-disable @typescript-eslint/unbound-method */
import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { GeneralBuilder } from '../../builder'
import type {
  TBuilderConfig,
  TCreateTxsOptions,
  TSendBaseOptionsWithSenderAddress
} from '../../types'
import { assertToIsString } from '../assertions'
import { parseUnits } from '../unit'
import { computeOverridenAmount, createTx, overrideTxAmount } from './create-txs'
import { isConfig } from './isConfig'

vi.mock('@paraspell/assets')
vi.mock('../assertions')
vi.mock('./isConfig')
vi.mock('../unit')

const makeApi = (cfg: TBuilderConfig<unknown>) =>
  ({
    getConfig: vi.fn(() => cfg)
  }) as unknown as IPolkadotApi<unknown, unknown>

const baseOptions = {
  api: makeApi({}),
  from: 'Acala',
  to: 'Hydration',
  senderAddress: 'SENDER',
  address: 'DEST',
  currency: { symbol: 'DOT', amount: '123' }
} as TCreateTxsOptions<unknown, unknown>

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

  it('treats non-config objects as not supporting abstractDecimals (falls back to parseUnits)', () => {
    const options = { ...baseOptions, api: makeApi({}) }
    vi.mocked(isConfig).mockReturnValue(false)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ decimals: 8 } as TAssetInfo)
    vi.mocked(parseUnits).mockReturnValue(12345n)

    const out = computeOverridenAmount(options, '7')
    expect(assertToIsString).toHaveBeenCalledWith('Hydration')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Acala', options.currency, 'Hydration')
    expect(parseUnits).toHaveBeenCalledWith('7', 8)
    expect(out).toBe(12468n) // 12345n + 123n
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
    } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptionsWithSenderAddress>

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
    } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptionsWithSenderAddress>

    const res = await createTx(baseOptions, builder, undefined)

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
    } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptionsWithSenderAddress>

    const res = await createTx(options, builder, '200')

    expect(builder.currency).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 323 }) // 123 + 200
    )
    expect(builder['buildInternal']).toHaveBeenCalledTimes(1)
    expect(res).toBe(tx)
  })
})
