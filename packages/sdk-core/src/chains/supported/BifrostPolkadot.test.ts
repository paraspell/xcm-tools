import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { AMOUNT_ALL } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import { createTypeAndThenCall } from '../../transfer'
import type {
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { assertHasLocation, getChain } from '../../utils'
import { createAsset } from '../../utils/asset'
import type BifrostPolkadot from './BifrostPolkadot'

vi.mock('../../pallets/xTokens')
vi.mock('../../pallets/polkadotXcm')
vi.mock('../../transfer')

type WithTransferToEthereum = BifrostPolkadot<unknown, unknown> & {
  transferToEthereum: BifrostPolkadot<unknown, unknown>['transferToEthereum']
}

describe('BifrostPolkadot', () => {
  let bifrostPolkadot: BifrostPolkadot<unknown, unknown>
  const mockXTokensInput = {
    asset: { symbol: 'BNC', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  const api = {
    callTxMethod: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockPolkadotXCMInput = {
    api,
    assetInfo: { symbol: 'WETH', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    bifrostPolkadot = getChain<unknown, unknown, 'BifrostPolkadot'>('BifrostPolkadot')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(bifrostPolkadot.chain).toBe('BifrostPolkadot')
    expect(bifrostPolkadot.info).toBe('bifrost')
    expect(bifrostPolkadot.ecosystem).toBe('Polkadot')
    expect(bifrostPolkadot.version).toBe(Version.V5)
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    vi.spyOn(bifrostPolkadot, 'getNativeAssetSymbol').mockReturnValue('BNC')

    bifrostPolkadot.transferXTokens(mockXTokensInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockXTokensInput, { Native: 'BNC' })
  })

  it('should call transferPolkadotXCM with correct parameters for WETH transfer', async () => {
    const assetInfo = {
      symbol: 'WETH',
      amount: 100n,
      location: { parents: 1, interior: 'Here' }
    } as WithAmount<TAssetInfo>

    await bifrostPolkadot.transferPolkadotXCM({ ...mockPolkadotXCMInput, assetInfo })

    assertHasLocation(assetInfo)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockPolkadotXCMInput,
        assetInfo,
        asset: createAsset(bifrostPolkadot.version, assetInfo.amount, assetInfo.location)
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferToEthereum when destination is Ethereum', async () => {
    const spyTransferToEth = vi
      .spyOn(bifrostPolkadot as WithTransferToEthereum, 'transferToEthereum')
      .mockResolvedValue({})

    const inputEth = {
      ...mockPolkadotXCMInput,
      destination: 'Ethereum',
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await bifrostPolkadot.transferPolkadotXCM(inputEth)

    expect(spyTransferToEth).toHaveBeenCalledTimes(1)
    expect(spyTransferToEth).toHaveBeenCalledWith(inputEth)

    expect(transferPolkadotXcm).not.toHaveBeenCalled()
  })

  it('should call transferPolkadotXCM with correct parameters for DOT transfer', async () => {
    const assetInfo = {
      symbol: 'DOT',
      amount: 100n,
      location: { parents: 1, interior: 'Here' }
    } as WithAmount<TAssetInfo>

    await bifrostPolkadot.transferPolkadotXCM({
      ...mockPolkadotXCMInput,
      assetInfo
    })

    expect(createTypeAndThenCall).toHaveBeenCalledTimes(1)
  })

  describe('canUseXTokens', () => {
    it('should return false when currency symbol is WETH and destination is AssetHubPolkadot', () => {
      const options = {
        assetInfo: { symbol: 'WETH' },
        to: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(false)
    })

    it('should return false when currency symbol is DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        assetInfo: { symbol: 'DOT' },
        to: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(false)
    })

    it('should return true when currency symbol is not WETH or DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        assetInfo: { symbol: 'BNC' },
        to: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currency symbol is WETH but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        assetInfo: { symbol: 'WETH' },
        to: 'Acala'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currency ymbol is DOT but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        assetInfo: { symbol: 'DOT' },
        to: 'Acala'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      bifrostPolkadot.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        parameters: {
          dest: { Id: mockOptions.address },
          currency_id: { Token2: 1 },
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: AMOUNT_ALL, assetId: '1' },
        address: 'address',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      bifrostPolkadot.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer_all',
        parameters: {
          dest: { Id: mockOptions.address },
          currency_id: { Token2: 1 },
          keep_alive: false
        }
      })
    })
  })
})
