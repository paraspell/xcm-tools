import { Version } from '@paraspell/sdk-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import type BifrostPolkadot from './BifrostPolkadot'

vi.mock('../../pallets/polkadotXcm')

type WithTransferToEthereum = BifrostPolkadot<unknown, unknown, unknown> & {
  transferToEthereum: BifrostPolkadot<unknown, unknown, unknown>['transferToEthereum']
}

describe('BifrostPolkadot', () => {
  let chain: BifrostPolkadot<unknown, unknown, unknown>

  const api = {
    deserializeExtrinsics: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown, unknown>

  const mockInput = {
    api,
    assetInfo: { symbol: 'WETH', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'BifrostPolkadot'>('BifrostPolkadot')
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

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should call transferToEthereum when destination is Ethereum', async () => {
    const spyTransferToEth = vi
      .spyOn(chain as WithTransferToEthereum, 'transferToEthereum')
      .mockResolvedValue({})

    const inputEth = {
      ...mockInput,
      destination: 'Ethereum',
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    await chain.transferPolkadotXCM(inputEth)

    expect(spyTransferToEth).toHaveBeenCalledTimes(1)
    expect(spyTransferToEth).toHaveBeenCalledWith(inputEth)

    expect(transferPolkadotXcm).not.toHaveBeenCalled()
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockOptions = {
        api,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(api, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(spy).toHaveBeenCalledWith({
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
      const mockOptions = {
        api,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(api, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(spy).toHaveBeenCalledWith({
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
