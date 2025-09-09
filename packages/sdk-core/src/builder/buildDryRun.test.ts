import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import { dryRun } from '../transfer'
import type { TBypassOptions, TDryRunResult, TSendBaseOptionsWithSenderAddress } from '../types'
import { buildDryRun } from './buildDryRun'

vi.mock('@paraspell/sdk-common')
vi.mock('../transfer')

describe('buildDryRun', () => {
  const api = {} as unknown as IPolkadotApi<unknown, unknown>
  const tx = 'TX' as unknown

  const baseOptions = {
    from: 'AssetHubPolkadot',
    to: 'Acala',
    address: 'ADDR',
    senderAddress: 'SENDER',
    currency: { symbol: 'DOT' },
    feeAsset: { symbol: 'USDT' }
  } as TSendBaseOptionsWithSenderAddress

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

  it('throws when address is a TLocation', () => {
    vi.mocked(isTLocation).mockReturnValueOnce(false).mockReturnValueOnce(true)

    expect(() => buildDryRun(api, tx, baseOptions)).toThrow(
      'Location address is not supported for XCM fee calculation.'
    )

    expect(dryRun).not.toHaveBeenCalled()
  })

  it('calls dryRun with mapped args when both are non-TLocation', async () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(dryRun).mockResolvedValue({} as TDryRunResult)

    const bypassOptions: TBypassOptions = { mintFeeAssets: true, sentAssetMintMode: 'preview' }

    const res = await buildDryRun(api, tx, baseOptions, bypassOptions)
    expect(res).toEqual({})

    expect(isTLocation).toHaveBeenCalledTimes(2)
    expect(isTLocation).toHaveBeenNthCalledWith(1, baseOptions.to)
    expect(isTLocation).toHaveBeenNthCalledWith(2, baseOptions.address)

    expect(dryRun).toHaveBeenCalledTimes(1)
    expect(dryRun).toHaveBeenCalledWith({
      api,
      tx,
      address: baseOptions.senderAddress,
      origin: baseOptions.from,
      destination: baseOptions.to,
      currency: baseOptions.currency,
      senderAddress: baseOptions.senderAddress,
      feeAsset: baseOptions.feeAsset,
      bypassOptions
    })
  })
})
