import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as BuilderModule from '../../builder'

vi.mock('@paraspell/assets', () => ({
  findAsset: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('./padFee', () => ({
  padFee: vi.fn()
}))

vi.mock('../../builder', () => ({
  Builder: vi.fn()
}))

import type { TAsset, TCurrencyInputWithAmount } from '@paraspell/assets'
import { findAsset, getNativeAssetSymbol, InvalidCurrencyError } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
import { getXcmFeeEstimate } from './getXcmFeeEstimate'
import { padFee } from './padFee'

const mockedFindAsset = vi.mocked(findAsset)
const mockedGetNativeAssetSymbol = vi.mocked(getNativeAssetSymbol)
const mockedPadFee = vi.mocked(padFee)

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

const common = {
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
    mockedGetNativeAssetSymbol.mockImplementation(c => (c.includes('Polkadot') ? 'DOT' : 'KSM'))
    const { api } = makeApi(0n, 0n)

    const spy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getXcmFeeEstimate({
      ...common,
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
    mockedGetNativeAssetSymbol.mockImplementation(c => (c.includes('Polkadot') ? 'DOT' : 'KSM'))
    const { api } = makeApi(0n, 0n)
    const res = await getXcmFeeEstimate({
      ...common,
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
    mockedPadFee.mockImplementationOnce(() => 1300n).mockImplementationOnce(() => 2600n)
    mockedFindAsset.mockReturnValue({ symbol: 'ABC' } as TAsset)
    mockedGetNativeAssetSymbol.mockReturnValue('UNIT')
    const { api } = makeApi(rawOrigin, rawDest)
    const res = await getXcmFeeEstimate({
      ...common,
      api,
      origin: 'BifrostPolkadot',
      destination: 'Hydration',
      currency: { symbol: 'ABC', amount: 5n }
    })
    expect(mockedPadFee).toHaveBeenCalledTimes(2)
    expect(mockedPadFee).toHaveBeenNthCalledWith(
      1,
      rawOrigin,
      'BifrostPolkadot',
      'Hydration',
      'origin'
    )
    expect(mockedPadFee).toHaveBeenNthCalledWith(
      2,
      rawDest,
      'BifrostPolkadot',
      'Hydration',
      'destination'
    )
    expect(res).toEqual({
      origin: { fee: 1300n, currency: 'UNIT' },
      destination: { fee: 2600n, currency: 'UNIT' }
    })
  })

  it('throws on multiasset currency', async () => {
    const { api } = makeApi(0n, 0n)
    await expect(
      getXcmFeeEstimate({
        ...common,
        api,
        origin: 'BifrostPolkadot',
        destination: 'Hydration',
        currency: { multiasset: [], amount: 1n } as TCurrencyInputWithAmount
      })
    ).rejects.toBeInstanceOf(InvalidCurrencyError)
  })

  it('throws when asset not found', async () => {
    mockedFindAsset.mockReturnValue(null)
    const { api } = makeApi(0n, 0n)
    await expect(
      getXcmFeeEstimate({
        ...common,
        api,
        origin: 'BifrostPolkadot',
        destination: 'Hydration',
        currency: { symbol: 'XYZ', amount: '1' }
      })
    ).rejects.toBeInstanceOf(InvalidCurrencyError)
  })
})
