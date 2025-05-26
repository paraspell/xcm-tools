import type { TAsset, TCurrencyInputWithAmount } from '@paraspell/assets'
import {
  findAssetForNodeOrThrow,
  getNativeAssetSymbol,
  InvalidCurrencyError
} from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import * as BuilderModule from '../../builder'
import { getOriginXcmFeeEstimate } from './getOriginXcmFeeEstimate'
import { getXcmFeeEstimate } from './getXcmFeeEstimate'
import { padFee } from './padFee'

vi.mock('@paraspell/assets', () => ({
  findAssetForNodeOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('./padFee', () => ({
  padFee: vi.fn()
}))

vi.mock('../../builder', () => ({
  Builder: vi.fn()
}))

vi.mock('./getOriginXcmFeeEstimate', () => ({
  getOriginXcmFeeEstimate: vi.fn()
}))

const makeApi = (originFee: bigint, destFee: bigint) => {
  const destApi = {
    init: vi.fn().mockResolvedValue(undefined),
    calculateTransactionFee: vi.fn().mockResolvedValue(destFee),
    clone: vi.fn()
  }
  destApi.clone.mockReturnValue(destApi)
  const api = {
    calculateTransactionFee: vi.fn().mockResolvedValue(originFee),
    clone: vi.fn()
  }
  api.clone.mockReturnValue(destApi)
  return {
    api: api as unknown as IPolkadotApi<unknown, unknown>,
    destApi: destApi as unknown as IPolkadotApi<unknown, unknown>
  }
}

const baseOptions = {
  tx: '0xdead',
  address: 'alice',
  senderAddress: 'bob'
}

beforeEach(() => {
  vi.clearAllMocks()
  const flippedTx = { tx: 'flip' }
  const mockBuilderInstance = {
    from: vi.fn().mockReturnThis(),
    to: vi.fn().mockReturnThis(),
    address: vi.fn().mockReturnThis(),
    senderAddress: vi.fn().mockReturnThis(),
    currency: vi.fn().mockReturnThis(),
    build: vi.fn().mockResolvedValue(flippedTx)
  } as unknown as BuilderModule.GeneralBuilder<unknown, unknown>
  vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)
})

describe('getXcmFeeEstimate', () => {
  it('returns bridge constants polkadot → kusama', async () => {
    vi.mocked(getNativeAssetSymbol).mockImplementation(c =>
      c.includes('Polkadot') ? 'DOT' : 'KSM'
    )
    const { api } = makeApi(0n, 0n)

    const spy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getXcmFeeEstimate({
      ...baseOptions,
      api,
      origin: 'AssetHubPolkadot',
      destination: 'AssetHubKusama',
      currency: { symbol: 'DOT', amount: 1n }
    })
    expect(res).toEqual({
      origin: { fee: 682_395_810n, currency: 'DOT' },
      destination: { fee: 12_016_807_000n, currency: 'KSM' }
    })
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns bridge constants kusama → polkadot', async () => {
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
      origin: { fee: 12_016_807_000n, currency: 'KSM' },
      destination: { fee: 682_395_810n, currency: 'DOT' }
    })
  })

  it('pads origin and destination fees on normal route', async () => {
    const rawOrigin = 1000n
    const rawDest = 2000n
    vi.mocked(getOriginXcmFeeEstimate).mockResolvedValue({
      fee: rawOrigin,
      currency: 'UNIT'
    })
    vi.mocked(padFee).mockImplementationOnce(() => 2600n)
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ABC' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('UNIT')
    const { api } = makeApi(rawOrigin, rawDest)
    const res = await getXcmFeeEstimate({
      ...baseOptions,
      api,
      origin: 'BifrostPolkadot',
      destination: 'Hydration',
      currency: { symbol: 'ABC', amount: 5n }
    })
    expect(padFee).toHaveBeenCalledTimes(1)
    expect(padFee).toHaveBeenCalledWith(2000n, 'BifrostPolkadot', 'Hydration', 'destination')
    expect(res).toEqual({
      origin: { fee: 1000n, currency: 'UNIT' },
      destination: { fee: 2600n, currency: 'UNIT' }
    })
  })

  it('throws on multiasset currency', async () => {
    const { api } = makeApi(0n, 0n)
    await expect(
      getXcmFeeEstimate({
        ...baseOptions,
        api,
        origin: 'BifrostPolkadot',
        destination: 'Hydration',
        currency: { multiasset: [], amount: 1n } as TCurrencyInputWithAmount
      })
    ).rejects.toBeInstanceOf(InvalidCurrencyError)
  })
})
