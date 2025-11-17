import { Version } from '@paraspell/sdk-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { AMOUNT_ALL } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getChain } from '../../utils'
import type BifrostPolkadot from './BifrostPolkadot'

vi.mock('../../pallets/xTokens')
vi.mock('../../pallets/polkadotXcm')

type WithTransferToEthereum = BifrostPolkadot<unknown, unknown> & {
  transferToEthereum: BifrostPolkadot<unknown, unknown>['transferToEthereum']
}

describe('BifrostPolkadot', () => {
  let chain: BifrostPolkadot<unknown, unknown>
  const mockXTokensInput = {
    asset: { symbol: 'BNC', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  const api = {
    deserializeExtrinsics: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockPolkadotXCMInput = {
    api,
    assetInfo: { symbol: 'WETH', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'BifrostPolkadot'>('BifrostPolkadot')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('BifrostPolkadot')
    expect(chain.info).toBe('bifrost')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM with transfer_assets', async () => {
    await chain.transferPolkadotXCM(mockPolkadotXCMInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockPolkadotXCMInput,
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    vi.spyOn(chain, 'getNativeAssetSymbol').mockReturnValue('BNC')

    chain.transferXTokens(mockXTokensInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockXTokensInput, { Native: 'BNC' })
  })

  it('should call transferToEthereum when destination is Ethereum', async () => {
    const spyTransferToEth = vi
      .spyOn(chain as WithTransferToEthereum, 'transferToEthereum')
      .mockResolvedValue({})

    const inputEth = {
      ...mockPolkadotXCMInput,
      destination: 'Ethereum',
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(inputEth)

    expect(spyTransferToEth).toHaveBeenCalledTimes(1)
    expect(spyTransferToEth).toHaveBeenCalledWith(inputEth)

    expect(transferPolkadotXcm).not.toHaveBeenCalled()
  })

  describe('canUseXTokens', () => {
    it('should return false when currency symbol is WETH and destination is AssetHubPolkadot', () => {
      const options = {
        assetInfo: { symbol: 'WETH' },
        to: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(chain['canUseXTokens'](options)).toBe(false)
    })

    it('should return false when currency symbol is DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        assetInfo: { symbol: 'DOT' },
        to: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(chain['canUseXTokens'](options)).toBe(false)
    })

    it('should return true when currency symbol is not WETH or DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        assetInfo: { symbol: 'BNC' },
        to: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(chain['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currency symbol is WETH but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        assetInfo: { symbol: 'WETH' },
        to: 'Acala'
      } as TSendInternalOptions<unknown, unknown>
      expect(chain['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currency ymbol is DOT but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        assetInfo: { symbol: 'DOT' },
        to: 'Acala'
      } as TSendInternalOptions<unknown, unknown>
      expect(chain['canUseXTokens'](options)).toBe(true)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        params: {
          dest: { Id: mockOptions.address },
          currency_id: { Token2: 1 },
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: AMOUNT_ALL, assetId: '1' },
        address: 'address',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: { Id: mockOptions.address },
          currency_id: { Token2: 1 },
          keep_alive: false
        }
      })
    })
  })
})
