import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Curio from './Curio'

vi.mock('../../pallets/polkadotXcm')

describe('Curio', () => {
  let chain: Curio<unknown, unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'CGT', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  const mockApi = {} as PolkadotApi<unknown, unknown, unknown>

  const nativeAsset: TAssetInfo = {
    symbol: 'KSM',
    decimals: 12,
    isNative: true,
    location: { parents: 1, interior: { Here: null } }
  }

  const foreignAsset: TAssetInfo = {
    symbol: 'BSX',
    decimals: 12,
    assetId: '0',
    location: {
      parents: 1,
      interior: { X2: [{ Parachain: 2090 }, { GeneralIndex: 0 }] }
    }
  }

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Curio'>('Curio')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Curio')
    expect(chain.info).toBe('curio')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V4)
  })

  it('should use the PolkadotXCM type-and-then transfer path', async () => {
    await chain.transferPolkadotXCM(mockInput)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should use Token IDs for native registry assets', () => {
    expect(chain.getCustomCurrencyId(mockApi, nativeAsset)).toEqual({ Token: 'KSM' })
  })

  it('should use ForeignAsset IDs for foreign registry assets', () => {
    expect(chain.getCustomCurrencyId(mockApi, foreignAsset)).toEqual({ ForeignAsset: 0 })
  })

  it('should use custom currency IDs when minting dry-run preview assets', () => {
    expect(chain['getMintConfig']()).toEqual({ useCustomCurrencyId: true })
  })

  it('uses the custom currency ID for local transfers', () => {
    expect(chain['getLocalCurrencyId'](mockApi, nativeAsset)).toEqual({ Token: 'KSM' })
  })
})
