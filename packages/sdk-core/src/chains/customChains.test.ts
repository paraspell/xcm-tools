import { canonicalizeLocation, type TAssetInfo, type TCustomAssetInfo } from '@paraspell/assets'
import type { TPalletEntry } from '@paraspell/pallets'
import type { TLocation, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@paraspell/assets', async importActual => ({
  ...(await importActual()),
  canonicalizeLocation: vi.fn((location: TLocation) => location)
}))

import { CustomChainConflictError, CustomChainInvalidError } from '../errors'
import type {
  TCustomChainEntry,
  TCustomChainEntryHydrated,
  TCustomChainInput,
  TCustomChainsMap
} from '../types'
import {
  buildCustomChainAssetsInfo,
  buildCustomChainConfig,
  normalizeCustomChains,
  resolveCustomChainAssetPallets
} from './customChains'

const baseInput = (overrides: Partial<TCustomChainInput> = {}): TCustomChainInput => ({
  paraId: 4242,
  ecosystem: 'Polkadot',
  providers: [{ name: 'rpc', endpoint: 'wss://example' }],
  xcmVersion: Version.V5,
  ...overrides
})

describe('normalizeCustomChains', () => {
  it('returns an empty map when input is undefined', () => {
    expect(normalizeCustomChains(undefined)).toEqual({})
  })

  it('normalizes a minimal valid entry, defaulting assets to []', () => {
    const result = normalizeCustomChains({ MyCustom: baseInput() })
    expect(result).toEqual({
      MyCustom: {
        name: 'MyCustom',
        paraId: 4242,
        ecosystem: 'Polkadot',
        providers: [{ name: 'rpc', endpoint: 'wss://example' }],
        xcmVersion: Version.V5,
        ss58Prefix: undefined,
        nativeAssetSymbol: undefined,
        nativeAssetDecimals: undefined,
        assets: []
      }
    })
  })

  it('propagates optional system-property overrides and assets', () => {
    const asset: TCustomAssetInfo = {
      symbol: 'X',
      decimals: 10,
      location: { parents: 1, interior: { X1: { Parachain: 1 } } }
    }
    const result = normalizeCustomChains({
      MyCustom: baseInput({
        ss58Prefix: 7,
        nativeAssetSymbol: 'CUS',
        nativeAssetDecimals: 12,
        assets: [asset]
      })
    })
    expect(result.MyCustom).toMatchObject({
      ss58Prefix: 7,
      nativeAssetSymbol: 'CUS',
      nativeAssetDecimals: 12,
      assets: [asset]
    })
  })

  it('canonicalizes each asset location', () => {
    const asset: TCustomAssetInfo = {
      symbol: 'NAT',
      decimals: 12,
      location: { parents: 1, interior: 'Here' }
    }
    normalizeCustomChains({ MyCustom: baseInput({ assets: [asset] }) })
    expect(canonicalizeLocation).toHaveBeenCalledWith(asset.location)
  })

  it('throws CustomChainConflictError when name collides with a built-in chain', () => {
    const input: TCustomChainsMap = { Acala: baseInput() }
    expect(() => normalizeCustomChains(input)).toThrow(CustomChainConflictError)
  })

  it('throws CustomChainInvalidError on invalid paraId', () => {
    const cases: Partial<TCustomChainInput>[] = [
      { paraId: -1 },
      { paraId: 1.5 },
      { paraId: 'x' as unknown as number }
    ]
    for (const overrides of cases) {
      expect(() => normalizeCustomChains({ MyCustom: baseInput(overrides) })).toThrow(
        CustomChainInvalidError
      )
    }
  })

  it('throws CustomChainInvalidError when providers are missing or empty', () => {
    expect(() => normalizeCustomChains({ MyCustom: baseInput({ providers: [] }) })).toThrow(
      CustomChainInvalidError
    )
  })

  it('preserves pallets.otherAssets when provided as an array', () => {
    const result = normalizeCustomChains({
      MyCustom: baseInput({
        pallets: { nativeAssets: 'Balances', otherAssets: ['Assets', 'ForeignAssets'] }
      })
    })
    expect(result.MyCustom.pallets).toEqual({
      nativeAssets: 'Balances',
      otherAssets: ['Assets', 'ForeignAssets']
    })
  })

  it('leaves pallets undefined when input.pallets is omitted', () => {
    const result = normalizeCustomChains({ MyCustom: baseInput() })
    expect(result.MyCustom.pallets).toBeUndefined()
  })

  it('throws CustomChainInvalidError when pallets reference unknown pallet names', () => {
    expect(() =>
      normalizeCustomChains({
        MyCustom: baseInput({
          pallets: { nativeAssets: 'Bogus' as unknown as 'Balances' }
        })
      })
    ).toThrow(CustomChainInvalidError)
    expect(() =>
      normalizeCustomChains({
        MyCustom: baseInput({
          pallets: { otherAssets: ['Assets', 'Bogus'] as unknown as ('Assets' | 'ForeignAssets')[] }
        })
      })
    ).toThrow(CustomChainInvalidError)
  })

  it('throws CustomChainInvalidError on duplicate asset locations', () => {
    const dupLoc = { parents: 1, interior: { X1: { Parachain: 1 } } }
    const input: TCustomChainsMap = {
      MyCustom: baseInput({
        assets: [
          { symbol: 'A', decimals: 12, location: dupLoc },
          { symbol: 'B', decimals: 12, location: dupLoc }
        ]
      })
    }
    expect(() => normalizeCustomChains(input)).toThrow(CustomChainInvalidError)
  })
})

describe('buildCustomChainConfig', () => {
  it('exposes name/info/paraId/providers from the normalized entry', () => {
    const entry: TCustomChainEntry = {
      name: 'MyCustom',
      paraId: 4242,
      ecosystem: 'Polkadot',
      providers: [{ name: 'rpc', endpoint: 'wss://example' }],
      xcmVersion: Version.V5,
      assets: []
    }
    expect(buildCustomChainConfig(entry)).toEqual({
      name: 'MyCustom',
      info: 'MyCustom',
      paraId: 4242,
      providers: [{ name: 'rpc', endpoint: 'wss://example' }]
    })
  })
})

describe('buildCustomChainAssetsInfo', () => {
  const hydrated = (
    overrides: Partial<TCustomChainEntryHydrated> = {}
  ): TCustomChainEntryHydrated => ({
    name: 'MyCustom',
    paraId: 4242,
    ecosystem: 'Polkadot',
    providers: [],
    xcmVersion: Version.V5,
    assets: [],
    nativeAssetSymbol: 'CUS',
    nativeAssetDecimals: 12,
    xcmPallet: 'PolkadotXcm',
    isEVM: false,
    supportsDryRunApi: true,
    supportsXcmPaymentApi: true,
    pallets: { nativeAssets: 'Balances', otherAssets: [] },
    ...overrides
  })

  it('synthesizes a native asset and prepends it to foreign assets when none is provided', () => {
    const foreign: TAssetInfo = {
      symbol: 'X',
      decimals: 10,
      location: { parents: 1, interior: { X1: { Parachain: 1 } } }
    }
    const info = buildCustomChainAssetsInfo(hydrated({ ss58Prefix: 7, assets: [foreign] }))
    expect(info).toEqual({
      relaychainSymbol: 'DOT',
      nativeAssetSymbol: 'CUS',
      isEVM: false,
      ss58Prefix: 7,
      supportsDryRunApi: true,
      supportsXcmPaymentApi: true,
      assets: [
        {
          symbol: 'CUS',
          decimals: 12,
          location: { parents: 1, interior: { X1: [{ Parachain: 4242 }] } },
          isNative: true
        },
        foreign
      ]
    })
  })

  it('uses the user-provided native asset and does not auto-prepend one', () => {
    const userNative: TAssetInfo = {
      symbol: 'CUS',
      decimals: 12,
      location: { parents: 1, interior: { X1: { Parachain: 4242 } } },
      isNative: true
    }
    const info = buildCustomChainAssetsInfo(hydrated({ assets: [userNative] }))
    expect(info.assets).toEqual([userNative])
  })

  it('defaults ss58Prefix to 42 when not hydrated', () => {
    const info = buildCustomChainAssetsInfo(hydrated())
    expect(info.ss58Prefix).toBe(42)
  })

  it('throws CustomChainInvalidError when nativeAssetSymbol is missing', () => {
    expect(() => buildCustomChainAssetsInfo(hydrated({ nativeAssetSymbol: undefined }))).toThrow(
      CustomChainInvalidError
    )
  })

  it('throws CustomChainInvalidError when nativeAssetDecimals is missing', () => {
    expect(() => buildCustomChainAssetsInfo(hydrated({ nativeAssetDecimals: undefined }))).toThrow(
      CustomChainInvalidError
    )
  })

  it.each<[TRelaychain, string]>([
    ['Polkadot', 'DOT'],
    ['Kusama', 'KSM'],
    ['Westend', 'WND'],
    ['Paseo', 'PAS']
  ])('maps ecosystem %s to relaychainSymbol %s', (ecosystem, expected) => {
    const info = buildCustomChainAssetsInfo(hydrated({ ecosystem }))
    expect(info.relaychainSymbol).toBe(expected)
  })
})

describe('resolveCustomChainAssetPallets', () => {
  const pallet = (name: string, hasExtrinsics = true): TPalletEntry => ({
    name,
    index: 0,
    hasExtrinsics
  })

  it('picks the highest-priority native and aggregates matching other pallets', () => {
    const result = resolveCustomChainAssetPallets('MyCustom', [
      pallet('Balances'),
      pallet('Tokens'),
      pallet('Assets'),
      pallet('ForeignAssets'),
      pallet('System'),
      pallet('Utility')
    ])
    expect(result.nativeAssets).toBe('Balances')
    expect(result.otherAssets).toEqual(['Tokens', 'Assets', 'ForeignAssets'])
  })

  it('falls back to lower-priority native pallets when Balances is missing', () => {
    const result = resolveCustomChainAssetPallets('MyCustom', [
      pallet('Currencies'),
      pallet('Assets')
    ])
    expect(result.nativeAssets).toBe('Currencies')
  })

  it('includes priority pallets that exist without extrinsics after those with extrinsics', () => {
    const result = resolveCustomChainAssetPallets('MyCustom', [
      pallet('Balances'),
      pallet('Assets'),
      pallet('ForeignAssets', false)
    ])
    expect(result.otherAssets).toEqual(['Assets', 'ForeignAssets'])
  })

  it('honors user override for nativeAssets even when detection would pick a different one', () => {
    const result = resolveCustomChainAssetPallets(
      'MyCustom',
      [pallet('Balances'), pallet('Tokens')],
      { nativeAssets: 'Tokens', otherAssets: [] }
    )
    expect(result.nativeAssets).toBe('Tokens')
  })

  it('honors user override for otherAssets when non-empty', () => {
    const result = resolveCustomChainAssetPallets(
      'MyCustom',
      [pallet('Balances'), pallet('Assets'), pallet('ForeignAssets')],
      { nativeAssets: 'Balances', otherAssets: ['ForeignAssets'] }
    )
    expect(result.otherAssets).toEqual(['ForeignAssets'])
  })

  it('throws CustomChainInvalidError when no native pallet is detected and no override is provided', () => {
    expect(() => resolveCustomChainAssetPallets('MyCustom', [pallet('System')])).toThrow(
      CustomChainInvalidError
    )
  })

  it('does not throw when an override supplies nativeAssets even with no detection match', () => {
    const result = resolveCustomChainAssetPallets('MyCustom', [pallet('System')], {
      nativeAssets: 'Balances',
      otherAssets: []
    })
    expect(result.nativeAssets).toBe('Balances')
  })
})
