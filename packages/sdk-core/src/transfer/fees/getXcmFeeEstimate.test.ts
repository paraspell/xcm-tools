import type { TAsset } from '@paraspell/assets'
import { findAssetForNodeOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getOriginXcmFeeEstimate } from './getOriginXcmFeeEstimate'
import { getReverseTxFee } from './getReverseTxFee'
import { getXcmFeeEstimate } from './getXcmFeeEstimate'
import { isSufficientDestination, isSufficientOrigin } from './isSufficient'
import { padFee } from './padFee'

vi.mock('@paraspell/assets', () => ({
  findAssetForNodeOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('./padFee', () => ({
  padFee: vi.fn()
}))

vi.mock('./getOriginXcmFeeEstimate', () => ({
  getOriginXcmFeeEstimate: vi.fn()
}))

vi.mock('./isSufficient', () => ({
  isSufficientOrigin: vi.fn(),
  isSufficientDestination: vi.fn()
}))

vi.mock('./getReverseTxFee', () => ({
  getReverseTxFee: vi.fn()
}))

vi.mock('../utils')

const makeApi = (originFee: bigint, destFee: bigint) => {
  const destApi = {
    init: vi.fn().mockResolvedValue(undefined),
    calculateTransactionFee: vi.fn().mockResolvedValue(destFee),
    clone: vi.fn()
  }
  destApi.clone.mockReturnValue(destApi)
  const api = {
    init: vi.fn().mockResolvedValue(undefined),
    calculateTransactionFee: vi.fn().mockResolvedValue(originFee),
    clone: vi.fn()
  }
  api.clone.mockReturnValue(destApi)
  return {
    api: api as unknown as IPolkadotApi<unknown, unknown>,
    destApi: destApi as unknown as IPolkadotApi<unknown, unknown>
  }
}

describe('getXcmFeeEstimate', () => {
  const baseOptions = {
    tx: '0xdead',
    address: 'alice',
    senderAddress: 'bob',
    receiverAddress: 'charlie',
    amount: 5n
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(isSufficientOrigin).mockResolvedValue(true)
    vi.mocked(isSufficientDestination).mockResolvedValue(true)
    vi.mocked(getReverseTxFee).mockResolvedValue(2000n)
  })

  it('returns bridge constants polkadot → kusama with sufficiency checks', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'DOT' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockImplementation(c =>
      c.includes('Polkadot') ? 'DOT' : 'KSM'
    )
    const { api } = makeApi(0n, 0n)

    const res = await getXcmFeeEstimate({
      ...baseOptions,
      api,
      origin: 'AssetHubPolkadot',
      destination: 'AssetHubKusama',
      currency: { symbol: 'DOT', amount: 1n }
    })

    expect(res).toEqual({
      origin: { fee: 682_395_810n, currency: 'DOT', sufficient: true },
      destination: { fee: 12_016_807_000n, currency: 'KSM', sufficient: true }
    })

    expect(isSufficientOrigin).toHaveBeenCalledWith(
      api,
      'AssetHubPolkadot',
      'AssetHubKusama',
      'bob',
      682_395_810n,
      { symbol: 'DOT', amount: 1n },
      { symbol: 'DOT' },
      undefined
    )
    expect(isSufficientDestination).toHaveBeenCalledWith(
      api.clone(),
      'AssetHubKusama',
      'alice',
      1n,
      { symbol: 'DOT' },
      12_016_807_000n
    )
  })

  it('returns bridge constants kusama → polkadot with sufficiency checks', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'KSM' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockImplementation(c =>
      c.includes('Polkadot') ? 'DOT' : 'KSM'
    )
    const { api } = makeApi(0n, 0n)

    const res = await getXcmFeeEstimate({
      ...baseOptions,
      api,
      origin: 'AssetHubKusama',
      destination: 'AssetHubPolkadot',
      currency: { symbol: 'KSM', amount: 1n }
    })

    expect(res).toEqual({
      origin: { fee: 12_016_807_000n, currency: 'KSM', sufficient: true },
      destination: { fee: 682_395_810n, currency: 'DOT', sufficient: true }
    })

    expect(isSufficientOrigin).toHaveBeenCalledWith(
      api,
      'AssetHubKusama',
      'AssetHubPolkadot',
      'bob',
      12_016_807_000n,
      { symbol: 'KSM', amount: 1n },
      { symbol: 'KSM' },
      undefined
    )
    expect(isSufficientDestination).toHaveBeenCalledWith(
      api.clone(),
      'AssetHubPolkadot',
      'alice',
      1n,
      { symbol: 'KSM' },
      682_395_810n
    )
  })

  it('pads origin and destination fees on normal route and includes sufficiency', async () => {
    const rawOrigin = 1000n
    const rawDest = 2000n

    vi.mocked(getOriginXcmFeeEstimate).mockResolvedValue({
      fee: rawOrigin,
      currency: 'UNIT',
      sufficient: true
    })
    vi.mocked(padFee).mockImplementationOnce(() => 2600n)
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ABC' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('UNIT')
    vi.mocked(getReverseTxFee).mockResolvedValue(rawDest)

    const { api, destApi } = makeApi(rawOrigin, rawDest)

    const res = await getXcmFeeEstimate({
      ...baseOptions,
      api,
      origin: 'BifrostPolkadot',
      destination: 'Hydration',
      currency: { symbol: 'ABC', amount: 5n }
    })

    expect(getReverseTxFee).toHaveBeenCalledWith(
      {
        ...baseOptions,
        api: destApi,
        origin: 'BifrostPolkadot',
        destination: 'Hydration',
        currency: { symbol: 'ABC', amount: 5n }
      },
      { symbol: 'ABC' }
    )

    expect(res).toEqual({
      origin: { fee: rawOrigin, currency: 'UNIT', sufficient: true },
      destination: { fee: rawDest, currency: 'UNIT', sufficient: true }
    })

    expect(getOriginXcmFeeEstimate).toHaveBeenCalledWith({
      ...baseOptions,
      api,
      origin: 'BifrostPolkadot',
      destination: 'Hydration',
      currency: { symbol: 'ABC', amount: 5n }
    })
  })
})
