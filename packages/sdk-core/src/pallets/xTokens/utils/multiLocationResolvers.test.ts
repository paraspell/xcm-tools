import { getOtherAssets, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { isRelayChain, Parents } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DOT_MULTILOCATION } from '../../../constants'
import type { TXTokensTransferOptions } from '../../../types'
import { buildMultiLocation } from './multiLocationResolvers'

vi.mock('@paraspell/assets', () => ({
  getOtherAssets: vi.fn(),
  isForeignAsset: vi.fn(),
  InvalidCurrencyError: class InvalidCurrencyError extends Error {}
}))

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: vi.fn(),
  Parents: {
    ONE: 1
  }
}))

describe('buildMultiLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseInput = {
    paraIdTo: 2000,
    asset: { symbol: 'TEST', assetId: '123' },
    origin: 'Acala',
    destination: 'Astar'
  } as TXTokensTransferOptions<unknown, unknown>

  it('returns multiLocation when asset is foreign and origin is Bifrost', () => {
    vi.mocked(isForeignAsset).mockReturnValue(true)

    const input = {
      ...baseInput,
      origin: 'BifrostPolkadot',
      asset: { assetId: '123' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildMultiLocation(input)
    expect(result).toEqual({
      parents: Parents.ONE,
      interior: {
        X3: [{ Parachain: 2000 }, { PalletInstance: '50' }, { GeneralIndex: 123n }]
      }
    })
  })

  it('returns asset.multiLocation when foreign asset has multiLocation', () => {
    vi.mocked(isForeignAsset).mockReturnValue(true)

    const multiLocation = { parents: Parents.ONE, interior: 'Here' }
    const input = {
      ...baseInput,
      asset: {
        assetId: '123',
        multiLocation
      }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildMultiLocation(input)
    expect(result).toBe(multiLocation)
  })

  it('returns default multiLocation when foreign asset has no multiLocation and origin is not Bifrost', () => {
    vi.mocked(isForeignAsset).mockReturnValue(true)

    const input = {
      ...baseInput,
      asset: { assetId: '123' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildMultiLocation(input)
    expect(result).toEqual({
      parents: Parents.ONE,
      interior: {
        X3: [{ Parachain: 2000 }, { PalletInstance: '50' }, { GeneralIndex: 123n }]
      }
    })
  })

  it('returns DOT_MULTILOCATION when asset is native and destination is relay chain', () => {
    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(true)

    const input = {
      ...baseInput,
      destination: 'Polkadot',
      asset: { symbol: 'DOT' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildMultiLocation(input)
    expect(result).toEqual(DOT_MULTILOCATION)
  })

  it('returns multiLocation object when destination is an object', () => {
    vi.mocked(isForeignAsset).mockReturnValue(false)

    const destObj = { parents: 0, interior: 'Here' }
    const input = {
      ...baseInput,
      destination: destObj,
      asset: { symbol: 'DOT' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildMultiLocation(input)
    expect(result).toBe(destObj)
  })

  it('returns multiLocation from AssetHub when asset is native and destination is string', () => {
    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const multiLocation: TMultiLocation = { parents: 1, interior: 'Here' }
    vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'DOT', multiLocation }])

    const input = {
      ...baseInput,
      destination: 'Polkadot',
      asset: { symbol: 'DOT' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildMultiLocation(input)
    expect(result).toBe(multiLocation)
  })

  it('throws InvalidCurrencyError when asset is native and not found in AssetHub', () => {
    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(getOtherAssets).mockReturnValue([])

    const input = {
      ...baseInput,
      destination: 'Polkadot',
      asset: { symbol: 'UNKNOWN' }
    } as TXTokensTransferOptions<unknown, unknown>

    expect(() => buildMultiLocation(input)).toThrow(InvalidCurrencyError)
  })
})
