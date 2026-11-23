import type { TAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api'
import { DryRunFailedError, MissingParameterError } from '../errors'
import type { TDryRunResult, TSubstrateTransferBaseOptions } from '../types'
import { buildDryRun } from './buildDryRun'
import { maybePerformXcmFormatCheck } from './maybePerformXcmFormatCheck'

vi.mock('../transfer')
vi.mock('./buildDryRun')

const CHAIN = 'Hydration'
const CHAIN_2 = 'AssetHubPolkadot'
const SENDER = 'sender-address'
const CURRENCY = { symbol: 'DOT', amount: 1000 }

const tx = 'TX'

const baseOptions = {
  from: CHAIN,
  to: CHAIN_2,
  sender: SENDER,
  currency: CURRENCY
} as TSubstrateTransferBaseOptions<unknown, unknown, unknown>

const dryRunOk = {
  success: true,
  origin: {
    success: true,
    fee: 0n,
    forwardedXcms: [],
    asset: { symbol: 'DOT', decimals: 10 } as TAssetInfo
  },
  hops: []
} as TDryRunResult

const dryRunClone = {
  marker: 'dry-run-clone'
} as unknown as PolkadotApi<unknown, unknown, unknown>

const createApi = (config: unknown) =>
  ({
    config,
    clone: vi.fn().mockReturnValue(dryRunClone)
  }) as unknown as PolkadotApi<unknown, unknown, unknown>

describe('maybePerformXcmFormatCheck', () => {
  beforeEach(() => {
    vi.mocked(buildDryRun).mockResolvedValue(dryRunOk)
  })

  it('does not run a dry run when xcmFormatCheck is not enabled', async () => {
    await maybePerformXcmFormatCheck(createApi({ abstractDecimals: true }), tx, baseOptions)

    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('does not run a dry run when the config is undefined', async () => {
    await maybePerformXcmFormatCheck(createApi(undefined), tx, baseOptions)

    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('does not run a dry run when the config is a url string', async () => {
    await maybePerformXcmFormatCheck(createApi('wss://example'), tx, baseOptions)

    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('does not run a dry run when called internally', async () => {
    await maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), tx, baseOptions, true)

    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('runs the dry run with the bypass mint mode when xcmFormatCheck is enabled', async () => {
    await maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), tx, baseOptions)

    expect(buildDryRun).toHaveBeenCalledExactlyOnceWith(
      dryRunClone,
      tx,
      expect.objectContaining({
        from: CHAIN,
        to: CHAIN_2,
        sender: SENDER,
        currency: CURRENCY
      }),
      { sentAssetMintMode: 'bypass' }
    )
  })

  it('runs the dry run against a detached clone so the caller api is not disconnected', async () => {
    const api = createApi({ xcmFormatCheck: true })

    const cloneSpy = vi.spyOn(api, 'clone')

    await maybePerformXcmFormatCheck(api, tx, baseOptions)

    expect(cloneSpy).toHaveBeenCalledTimes(1)
  })

  it('throws a DryRunFailedError carrying the dry run error when the dry run fails', async () => {
    const dryRunError = { reason: 'Bad XCM format', chain: CHAIN_2, chainKind: 'origin' }
    vi.mocked(buildDryRun).mockResolvedValue({ dryRunError } as TDryRunResult)

    const call = () =>
      maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), tx, baseOptions)

    await expect(call()).rejects.toBeInstanceOf(DryRunFailedError)
    await expect(call()).rejects.toMatchObject({
      dryRunError,
      message: `XCM format check failed. Dry run on ${CHAIN_2} failed: Bad XCM format`
    })
  })

  it('requires a sender before running the dry run', async () => {
    await expect(
      maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), tx, {
        ...baseOptions,
        sender: undefined
      })
    ).rejects.toBeInstanceOf(MissingParameterError)

    expect(buildDryRun).not.toHaveBeenCalled()
  })
})
