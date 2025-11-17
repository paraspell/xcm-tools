import { getOtherAssets, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isRelayChain, Parents } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DOT_LOCATION } from '../../../constants'
import type { TXTokensTransferOptions } from '../../../types'
import { buildLocation } from './locationResolvers'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: vi.fn(),
  Parents: {
    ONE: 1
  }
}))

describe('buildLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseInput = {
    paraIdTo: 2000,
    asset: { symbol: 'TEST', assetId: '123' },
    origin: 'Acala',
    destination: 'Astar'
  } as TXTokensTransferOptions<unknown, unknown>

  it('returns location when asset is foreign and origin is Bifrost', () => {
    vi.mocked(isForeignAsset).mockReturnValue(true)

    const input = {
      ...baseInput,
      origin: 'BifrostPolkadot',
      asset: { assetId: '123' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildLocation(input)
    expect(result).toEqual({
      parents: Parents.ONE,
      interior: {
        X3: [{ Parachain: 2000 }, { PalletInstance: '50' }, { GeneralIndex: 123n }]
      }
    })
  })

  it('returns asset.location when foreign asset has location', () => {
    vi.mocked(isForeignAsset).mockReturnValue(true)

    const location = { parents: Parents.ONE, interior: 'Here' }
    const input = {
      ...baseInput,
      asset: {
        assetId: '123',
        location
      }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildLocation(input)
    expect(result).toBe(location)
  })

  it('returns default location when foreign asset has no location and origin is not Bifrost', () => {
    vi.mocked(isForeignAsset).mockReturnValue(true)

    const input = {
      ...baseInput,
      asset: { assetId: '123' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildLocation(input)
    expect(result).toEqual({
      parents: Parents.ONE,
      interior: {
        X3: [{ Parachain: 2000 }, { PalletInstance: '50' }, { GeneralIndex: 123n }]
      }
    })
  })

  it('returns DOT_LOCATION when asset is native and destination is relay chain', () => {
    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(true)

    const input = {
      ...baseInput,
      destination: 'Polkadot',
      asset: { symbol: 'DOT' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildLocation(input)
    expect(result).toEqual(DOT_LOCATION)
  })

  it('returns location object when destination is an object', () => {
    vi.mocked(isForeignAsset).mockReturnValue(false)

    const destObj = { parents: 0, interior: 'Here' }
    const input = {
      ...baseInput,
      destination: destObj,
      asset: { symbol: 'DOT' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildLocation(input)
    expect(result).toBe(destObj)
  })

  it('returns location from AssetHub when asset is native and destination is string', () => {
    vi.mocked(isForeignAsset).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const location: TLocation = { parents: 1, interior: 'Here' }
    vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'DOT', decimals: 10, location }])

    const input = {
      ...baseInput,
      destination: 'Polkadot',
      asset: { symbol: 'DOT' }
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildLocation(input)
    expect(result).toBe(location)
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

    expect(() => buildLocation(input)).toThrow(InvalidCurrencyError)
  })
})
