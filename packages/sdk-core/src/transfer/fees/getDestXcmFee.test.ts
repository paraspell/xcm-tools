import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow, hasDryRunSupport, InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import type { TDryRunChainResult, TGetFeeForDestChainOptions } from '../../types'
import { getDestXcmFee } from './getDestXcmFee'
import { getReverseTxFee } from './getReverseTxFee'
import { isSufficientDestination } from './isSufficient'

vi.mock('@paraspell/assets')
vi.mock('./getReverseTxFee')
vi.mock('./isSufficient')

const createApi = (dryRunRes?: TDryRunChainResult) =>
  ({
    getDryRunXcm: vi.fn().mockResolvedValue(dryRunRes ?? {})
  }) as unknown as IPolkadotApi<unknown, unknown>

describe('getDestXcmFee', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'UNIT' } as TAssetInfo)
    vi.mocked(isSufficientDestination).mockResolvedValue(true)
  })

  it('returns a padded “paymentInfo” fee when dry-run is not supported', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(getReverseTxFee).mockResolvedValue(130n)

    const api = createApi()

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      asset: { symbol: 'UNIT' },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'UNIT', amount: 1n })
    expect(isSufficientDestination).toHaveBeenCalledWith(
      api,
      'Astar',
      'dest',
      1n,
      {
        symbol: 'UNIT'
      },
      130n
    )
    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo', sufficient: true })
  })

  it('returns a padded “paymentInfo” fee when dry-run is not supported and origin asset has location', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(getReverseTxFee).mockResolvedValue(130n)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'UNIT',
      decimals: 12,
      location: DOT_LOCATION
    })

    const api = createApi()

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      asset: { symbol: 'UNIT' },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { location: DOT_LOCATION, amount: 1n })
    expect(isSufficientDestination).toHaveBeenCalledWith(
      api,
      'Astar',
      'dest',
      1n,
      {
        symbol: 'UNIT'
      },
      130n
    )
    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo', sufficient: true })
  })

  it('returns a padded “paymentInfo” fee when dry-run is not supported, and fails with ML', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(getReverseTxFee).mockRejectedValueOnce(new InvalidCurrencyError(''))
    vi.mocked(getReverseTxFee).mockResolvedValueOnce(130n)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'UNIT',
      decimals: 12,
      location: DOT_LOCATION
    })

    const api = createApi()

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'FOO', amount: 1n },
      asset: { symbol: 'UNIT' },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { location: DOT_LOCATION, amount: 1n })
    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'UNIT', amount: 1n })
    expect(isSufficientDestination).toHaveBeenCalledWith(
      api,
      'Astar',
      'dest',
      1n,
      {
        symbol: 'UNIT'
      },
      130n
    )
    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo', sufficient: true })
  })

  it('returns a “dryRun” fee (plus forwarded XCMs) when dry-run succeeds', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const dryRunObj: TDryRunChainResult = {
      success: true,
      fee: 200n,
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 3320,
      currency: 'DOT',
      asset: { symbol: 'DOT', decimals: 10 } as TAssetInfo
    }
    const api = createApi(dryRunObj)

    const res = await getDestXcmFee({
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      prevChain: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>)

    expect(res).toEqual({
      fee: 200n,
      feeType: 'dryRun',
      sufficient: true,
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 3320
    })
    expect(isSufficientDestination).not.toHaveBeenCalled()
  })

  it('falls back to “paymentInfo” and returns `dryRunError` when dry-run fails', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const api = createApi({
      success: false,
      failureReason: 'fail',
      currency: 'DOT',
      asset: { symbol: 'DOT', decimals: 10 } as TAssetInfo
    })

    vi.mocked(getReverseTxFee).mockResolvedValue(130n)

    const options = {
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      prevChain: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'UNIT', amount: 1n })
    expect(res).toEqual({
      fee: 130n,
      feeType: 'paymentInfo',
      dryRunError: 'fail',
      sufficient: false
    })
  })

  it('returns error variant (only `dryRunError`) when fallback is disabled', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const api = createApi({
      success: false,
      failureReason: 'boom',
      currency: 'DOT',
      asset: { symbol: 'DOT', decimals: 10 } as TAssetInfo
    })

    const res = await getDestXcmFee({
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      prevChain: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      disableFallback: true
    } as TGetFeeForDestChainOptions<unknown, unknown>)

    expect(res).toEqual({ dryRunError: 'boom' })
    expect('fee' in res).toBe(false)
  })

  it('falls back to swapConfig.currencyTo when origin currency is unsupported (uses location)', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    const api = createApi()

    vi.mocked(findAssetInfoOrThrow)
      .mockImplementationOnce(() => {
        throw new InvalidCurrencyError('nope')
      })
      .mockReturnValueOnce({
        symbol: 'USDC',
        decimals: 6,
        location: DOT_LOCATION
      } as TAssetInfo)

    vi.mocked(getReverseTxFee).mockResolvedValue(321n)

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      asset: { symbol: 'UNIT' },
      disableFallback: false,
      swapConfig: {
        exchangeChain: 'AssetHubPolkadot',
        currencyTo: { symbol: 'USDC' },
        amountOut: 5000n
      }
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { location: DOT_LOCATION, amount: 5000n })
    expect(res).toEqual({ fee: 321n, feeType: 'paymentInfo', sufficient: true })
  })

  it('falls back to swapConfig.currencyTo when origin currency is unsupported (uses symbol)', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    const api = createApi()

    vi.mocked(findAssetInfoOrThrow)
      .mockImplementationOnce(() => {
        throw new InvalidCurrencyError('nope')
      })
      .mockReturnValueOnce({
        symbol: 'USDC',
        decimals: 6
      } as TAssetInfo)

    vi.mocked(getReverseTxFee).mockResolvedValue(777n)

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      asset: { symbol: 'UNIT' },
      disableFallback: false,
      swapConfig: {
        exchangeChain: 'AssetHubPolkadot',
        currencyTo: { symbol: 'USDC' },
        amountOut: 1234n
      }
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'USDC', amount: 1234n })
    expect(res).toEqual({ fee: 777n, feeType: 'paymentInfo', sufficient: true })
  })

  it('returns 0n when destination is Ethereum', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    const api = createApi()
    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Ethereum',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      asset: { symbol: 'UNIT' },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(res).toEqual({ fee: 0n, feeType: 'paymentInfo', sufficient: true })
    expect(getReverseTxFee).not.toHaveBeenCalled()
  })
})
