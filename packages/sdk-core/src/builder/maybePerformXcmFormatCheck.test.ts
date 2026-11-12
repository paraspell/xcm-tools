import type { TAssetInfo } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api/PolkadotApi'
import { DryRunFailedError, MissingParameterError } from '../errors'
import type { TDryRunResult, TSubstrateTransferBaseOptions } from '../types'
import { buildDryRun } from './buildDryRun'
import { maybePerformXcmFormatCheck } from './maybePerformXcmFormatCheck'

vi.mock('./buildDryRun')

const createApi = (config?: unknown): PolkadotApi<unknown, unknown, unknown> =>
  ({ config }) as unknown as PolkadotApi<unknown, unknown, unknown>

const mockTx = { method: 'transfer', args: [] }

const baseOptions = {
  from: 'Acala',
  to: 'Hydration',
  currency: { symbol: 'ACA', amount: 100 },
  recipient: 'recipient-address',
  sender: 'sender-address'
} as unknown as TSubstrateTransferBaseOptions<unknown, unknown, unknown>

const mockDryRunSuccess: TDryRunResult = {
  success: true,
  origin: {
    success: true,
    fee: 0n,
    forwardedXcms: null,
    asset: {} as TAssetInfo
  },
  hops: []
}

describe('maybePerformXcmFormatCheck', () => {
  it('does nothing when config is undefined', async () => {
    await maybePerformXcmFormatCheck(createApi(undefined), mockTx, baseOptions)
    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('does nothing when config is a string or primitive', async () => {
    await maybePerformXcmFormatCheck(createApi('wss://example'), mockTx, baseOptions)
    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('does nothing when xcmFormatCheck is not enabled', async () => {
    await maybePerformXcmFormatCheck(createApi({ development: true }), mockTx, baseOptions)
    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('does nothing when xcmFormatCheck is false', async () => {
    await maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: false }), mockTx, baseOptions)
    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('does nothing when isCalledInternally is true even if xcmFormatCheck is true', async () => {
    await maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), mockTx, baseOptions, true)
    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('throws MissingParameterError if sender is missing when xcmFormatCheck is true', async () => {
    const optionsWithoutSender = { ...baseOptions, sender: undefined }
    await expect(
      maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), mockTx, optionsWithoutSender)
    ).rejects.toBeInstanceOf(MissingParameterError)
    expect(buildDryRun).not.toHaveBeenCalled()
  })

  it('runs buildDryRun with bypass mode when xcmFormatCheck is true', async () => {
    vi.mocked(buildDryRun).mockResolvedValue(mockDryRunSuccess)
    const api = createApi({ xcmFormatCheck: true })

    await maybePerformXcmFormatCheck(api, mockTx, baseOptions)

    expect(buildDryRun).toHaveBeenCalledExactlyOnceWith(
      api,
      mockTx,
      {
        ...baseOptions,
        sender: 'sender-address'
      },
      {
        sentAssetMintMode: 'bypass'
      }
    )
  })

  it('throws DryRunFailedError when dry run reports dryRunError', async () => {
    vi.mocked(buildDryRun).mockResolvedValue({
      dryRunError: { reason: 'Bad XCM format', chain: 'Hydration' }
    } as TDryRunResult)

    await expect(
      maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), mockTx, baseOptions)
    ).rejects.toBeInstanceOf(DryRunFailedError)
  })
})
