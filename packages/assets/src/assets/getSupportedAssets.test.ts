import type { TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TAssetInfo } from '../types'
import { getAssetsImpl, getNativeAssetSymbolImpl } from './assets'
import { getSupportedAssets } from './getSupportedAssets'
import { findStablecoinAssets } from './search/findStablecoinAssets'

vi.mock('./assets')
vi.mock('./search/findStablecoinAssets')

const createAsset = (symbol: string, location: TLocation): TAssetInfo => ({
  symbol,
  decimals: 10,
  existentialDeposit: '1',
  location
})

const createEthLocation = (key: string): TLocation => ({
  parents: 2,
  interior: {
    X2: [
      { GlobalConsensus: { Ethereum: { chainId: 1 } } },
      { AccountKey20: { network: null, key } }
    ]
  }
})

const mockAssets = (assets: Partial<Record<string, TAssetInfo[]>>) =>
  vi.mocked(getAssetsImpl).mockImplementation(chain => assets[chain] ?? [])

const dotAsset = createAsset('DOT', { parents: 1, interior: { Here: null } })
const ksmAsset = createAsset('KSM', {
  parents: 2,
  interior: { X1: [{ GlobalConsensus: { kusama: null } }] }
})
const ajunAsset = createAsset('AJUN', { parents: 1, interior: { X1: [{ Parachain: 2051 }] } })
const cgtAsset = createAsset(
  'CGT2.0',
  createEthLocation('0x0e186357c323c806c1efdad36d217f7a54b63d18')
)
const mythAsset = createAsset('MYTH', { parents: 1, interior: { X1: [{ Parachain: 3369 }] } })

describe('getSupportedAssets', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return no assets for unreachable destinations', () => {
    expect(getSupportedAssets('Acala', 'Ethereum')).toEqual([])
    expect(getAssetsImpl).not.toHaveBeenCalled()
  })

  it('should return origin assets with a matching location on destination', () => {
    mockAssets({ Hydration: [dotAsset, ajunAsset], AssetHubPolkadot: [dotAsset] })

    expect(getSupportedAssets('Hydration', 'AssetHubPolkadot')).toEqual([dotAsset])
  })

  it('should return native system assets, stablecoins and additional bridge assets for substrate bridge transfers', () => {
    const usdtAsset = createAsset('USDT', {
      parents: 1,
      interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
    })
    const wndAsset = createAsset('WND', {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { westend: null } }] }
    })
    mockAssets({
      AssetHubPolkadot: [dotAsset, ksmAsset, wndAsset, { ...ajunAsset, symbol: 'KSM' }, cgtAsset],
      AssetHubKusama: [dotAsset, ksmAsset, cgtAsset]
    })
    vi.mocked(getNativeAssetSymbolImpl).mockImplementation(chain =>
      chain === 'AssetHubPolkadot' ? 'DOT' : 'KSM'
    )
    vi.mocked(findStablecoinAssets).mockReturnValue([usdtAsset])

    expect(getSupportedAssets('AssetHubPolkadot', 'AssetHubKusama')).toEqual([
      dotAsset,
      ksmAsset,
      usdtAsset,
      cgtAsset
    ])
  })

  it('should return system assets registered on destination and common assets for snowbridge transfers', () => {
    const ethDotAsset = createAsset(
      'DOT',
      createEthLocation('0x196c20da81fbc324ecdf55501e95ce9f0bd84d14')
    )
    mockAssets({
      AssetHubPolkadot: [dotAsset, ksmAsset, mythAsset, cgtAsset],
      Ethereum: [ethDotAsset, cgtAsset]
    })

    expect(getSupportedAssets('AssetHubPolkadot', 'Ethereum')).toEqual([dotAsset, cgtAsset])
  })

  it('should include native MYTH for Mythos to Ethereum transfers', () => {
    mockAssets({
      Mythos: [mythAsset],
      Ethereum: [
        createAsset('MYTH', createEthLocation('0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003'))
      ]
    })

    expect(getSupportedAssets('Mythos', 'Ethereum')).toEqual([mythAsset])
  })
})
