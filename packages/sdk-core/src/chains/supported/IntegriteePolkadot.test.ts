import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChainNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type IntegriteePolkadot from './IntegriteePolkadot'

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../utils')

describe('IntegriteePolkadot', () => {
  let chain: IntegriteePolkadot<unknown, unknown>

  const mockInput = {
    scenario: 'ParaToPara',
    assetInfo: {
      symbol: 'KILT',
      amount: 100n
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'IntegriteePolkadot'>('IntegriteePolkadot')
    vi.clearAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('IntegriteePolkadot')
    expect(chain.info).toBe('integritee')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM with transfer_assets', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput, 'transfer_assets', 'Unlimited')
  })

  it('transferRelayToPara should throw ChainNotSupportedError', () => {
    expect(() => chain.transferRelayToPara()).toThrow(ChainNotSupportedError)
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call Assets.transfer with correct params', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        parameters: {
          id: 1,
          target: { Id: 'address' },
          amount: 100n
        }
      })
    })
  })
})
