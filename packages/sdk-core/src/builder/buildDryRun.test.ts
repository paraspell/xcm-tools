import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api'
import { dryRun } from '../transfer'
import type {
  TBypassOptions,
  TDryRunResult,
  TSubstrateTransferBaseOptionsWithSender
} from '../types'
import { buildDryRun } from './buildDryRun'

vi.mock('@paraspell/sdk-common')
vi.mock('../transfer')

describe('buildDryRun', () => {
  const api = {} as unknown as PolkadotApi<unknown, unknown, unknown>
  const tx = 'TX' as unknown

  const baseOptions = {
    from: 'AssetHubPolkadot',
    to: 'Acala',
    sender: 'SENDER',
    currency: { symbol: 'DOT' },
    feeAsset: { symbol: 'USDT' }
  } as TSubstrateTransferBaseOptionsWithSender<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when destination "to" is a TLocation', () => {
    vi.mocked(isTLocation).mockReturnValueOnce(true)

    expect(() => buildDryRun(api, tx, baseOptions)).toThrow(
      'Location destination is not supported for XCM fee calculation.'
    )

    expect(dryRun).not.toHaveBeenCalled()
  })

  it('calls dryRun with mapped args when both are non-TLocation', async () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(dryRun).mockResolvedValue({} as TDryRunResult)

    const bypassOptions: TBypassOptions = { mintFeeAssets: true, sentAssetMintMode: 'preview' }

    const res = await buildDryRun(api, tx, baseOptions, bypassOptions)
    expect(res).toEqual({})

    expect(isTLocation).toHaveBeenCalledTimes(1)
    expect(isTLocation).toHaveBeenNthCalledWith(1, baseOptions.to)

    expect(dryRun).toHaveBeenCalledTimes(1)
    expect(dryRun).toHaveBeenCalledWith({
      api,
      tx,
      origin: baseOptions.from,
      destination: baseOptions.to,
      currency: baseOptions.currency,
      sender: baseOptions.sender,
      feeAsset: baseOptions.feeAsset,
      bypassOptions
    })
  })
})
