// createTxs.test.ts
import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow } from '@paraspell/assets'
import { parseUnits } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { GeneralBuilder } from '../../builder'
import { BYPASS_CURRENCY_AMOUNT } from '../../constants'
import type {
  TBuilderConfig,
  TCreateTxsOptions,
  TSendBaseOptionsWithSenderAddress
} from '../../types'
import { assertToIsString } from '../assertions'
import { computeOverridenAmount, createTxs, overrideTxAmount } from './create-txs'
import { isConfig } from './isConfig'

vi.mock('@paraspell/assets')
vi.mock('../assertions')
vi.mock('./isConfig')
vi.mock('viem')

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
  currency: { symbol: 'DOT', amount: 123n }
} as TCreateTxsOptions<unknown, unknown>

describe('computeOverridenAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns BYPASS_CURRENCY_AMOUNT when config.abstractDecimals is true', () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: true }) }
    vi.mocked(isConfig).mockReturnValue(true)

    const out = computeOverridenAmount(options)
    expect(out).toBe(BYPASS_CURRENCY_AMOUNT)
    expect(assertToIsString).not.toHaveBeenCalled()
    expect(findAssetInfoOrThrow).not.toHaveBeenCalled()
    expect(parseUnits).not.toHaveBeenCalled()
  })

  it('uses findAssetInfoOrThrow + parseUnits when abstractDecimals is false', () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: false }) }
    vi.mocked(isConfig).mockReturnValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ decimals: 12 } as TAssetInfo)
    vi.mocked(parseUnits).mockReturnValue(999n)

    const out = computeOverridenAmount(options)
    expect(assertToIsString).toHaveBeenCalledWith('Hydration')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Acala', options.currency, 'Hydration')
    expect(parseUnits).toHaveBeenCalledWith(BYPASS_CURRENCY_AMOUNT, 12)
    expect(out).toBe(999n)
  })

  it('treats non-config objects as not supporting abstractDecimals (falls back to parseUnits)', () => {
    const options = { ...baseOptions, api: makeApi({}) }
    vi.mocked(isConfig).mockReturnValue(false)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ decimals: 8 } as TAssetInfo)
    vi.mocked(parseUnits).mockReturnValue(12345n)

    const out = computeOverridenAmount(options)
    expect(assertToIsString).toHaveBeenCalledWith('Hydration')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Acala', options.currency, 'Hydration')
    expect(parseUnits).toHaveBeenCalledWith(BYPASS_CURRENCY_AMOUNT, 8)
    expect(out).toBe(12345n)
  })
})

describe('overrideTxAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls builder.currency with overridden amount and builds tx', async () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: true }) }
    vi.mocked(isConfig).mockReturnValue(true)

    const builtTx = { kind: 'bypassTx' }
    const builder = {
      currency: vi.fn().mockReturnThis(),
      buildInternal: vi.fn().mockResolvedValue(builtTx)
    } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptionsWithSenderAddress>

    const currencySpy = vi.spyOn(builder, 'currency')

    const out = await overrideTxAmount(options, builder)

    expect(currencySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: BYPASS_CURRENCY_AMOUNT
      })
    )
    expect(out).toBe(builtTx)
  })
})

describe('createTxs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds real tx first and then bypass-amount tx via overrideTxAmount', async () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: true }) }
    vi.mocked(isConfig).mockReturnValue(true)

    const realTx = { kind: 'realTx' }
    const bypassTx = { kind: 'bypassTx' }

    const buildInternal = vi.fn().mockResolvedValueOnce(realTx).mockResolvedValueOnce(bypassTx)

    const builder = {
      currency: vi.fn().mockReturnThis(),
      buildInternal
    } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptionsWithSenderAddress>

    const currencySpy = vi.spyOn(builder, 'currency')

    const res = await createTxs(options, builder)

    expect(buildInternal).toHaveBeenCalledTimes(2)
    expect(currencySpy).toHaveBeenCalledTimes(1)
    expect(currencySpy).toHaveBeenCalledWith(
      expect.objectContaining({ amount: BYPASS_CURRENCY_AMOUNT })
    )

    expect(res).toEqual({ tx: realTx, txBypass: bypassTx })
  })

  it('when abstractDecimals is false, override path still uses computeOverridenAmount (parseUnits)', async () => {
    const options = { ...baseOptions, api: makeApi({ abstractDecimals: false }) }
    vi.mocked(isConfig).mockReturnValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ decimals: 10 } as TAssetInfo)
    vi.mocked(parseUnits).mockReturnValue(4242n)

    const realTx = { kind: 'realTx' }
    const bypassTx = { kind: 'bypassTx' }
    const buildInternal = vi.fn().mockResolvedValueOnce(realTx).mockResolvedValueOnce(bypassTx)

    const builder = {
      currency: vi.fn().mockReturnThis(),
      buildInternal
    } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptionsWithSenderAddress>

    const currencySpy = vi.spyOn(builder, 'currency')

    const res = await createTxs(options, builder)

    expect(assertToIsString).toHaveBeenCalledWith('Hydration')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Acala', options.currency, 'Hydration')
    expect(parseUnits).toHaveBeenCalledWith(BYPASS_CURRENCY_AMOUNT, 10)
    expect(currencySpy).toHaveBeenCalledWith(expect.objectContaining({ amount: 4242n }))

    expect(res).toEqual({ tx: realTx, txBypass: bypassTx })
  })
})
