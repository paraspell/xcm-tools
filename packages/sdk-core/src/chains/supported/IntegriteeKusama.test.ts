import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import { getChain } from '../../utils/getChain'
import type IntegriteeKusama from './IntegriteeKusama'

vi.mock('../../utils', () => ({
  assertHasId: vi.fn()
}))

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('IntegriteeKusama', () => {
  let chain: IntegriteeKusama<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'IntegriteeKusama'>('IntegriteeKusama')
    vi.clearAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('IntegriteeKusama')
    expect(chain.info).toBe('integritee')
    expect(chain.type).toBe('kusama')
    expect(chain.version).toBe(Version.V4)
  })

  it('should handle ParaToPara transfers with native asset', async () => {
    const mockNativeSymbol = 'TEER'
    vi.spyOn(chain, 'getNativeAssetSymbol').mockReturnValue(mockNativeSymbol)

    const input = {
      scenario: 'ParaToPara',
      asset: { symbol: mockNativeSymbol, amount: 100n }
    } as TXTokensTransferOptions<unknown, unknown>

    await chain.transferXTokens(input)

    expect(transferXTokens).toHaveBeenCalledWith(input, mockNativeSymbol)
  })

  it('should throw ScenarioNotSupportedError for non-ParaToPara scenarios', () => {
    const scenarios = ['RelayToPara', 'ParaToRelay'] as const

    scenarios.forEach(scenario => {
      const input = {
        scenario,
        asset: { symbol: 'TEER', amount: 100n }
      } as TXTokensTransferOptions<unknown, unknown>

      expect(() => chain.transferXTokens(input)).toThrow(
        new ScenarioNotSupportedError('IntegriteeKusama', scenario)
      )
    })
  })

  it('should throw InvalidCurrencyError for non-native assets', () => {
    vi.spyOn(chain, 'getNativeAssetSymbol').mockReturnValue('TEER')

    const input = {
      scenario: 'ParaToPara',
      asset: { symbol: 'KSM', amount: 100n }
    } as TXTokensTransferOptions<unknown, unknown>

    expect(() => chain.transferXTokens(input)).toThrow(
      new InvalidCurrencyError('Asset KSM is not supported by chain IntegriteeKusama.')
    )
  })

  it('should throw ChainNotSupportedError for transferRelayToPara', () => {
    expect(() => chain.transferRelayToPara()).toThrow(ChainNotSupportedError)
  })

  it('should handle local non-native asset transfers', () => {
    const mockCallTxMethod = vi.fn().mockReturnValue('tx-result')
    const mockApi = { callTxMethod: mockCallTxMethod } as unknown as IPolkadotApi<unknown, unknown>

    const options = {
      api: mockApi,
      assetInfo: {
        symbol: 'USDT',
        amount: 1000000n,
        assetId: '123'
      },
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
    } as TTransferLocalOptions<unknown, unknown>

    const result = chain.transferLocalNonNativeAsset(options)

    expect(assertHasId).toHaveBeenCalledWith(options.assetInfo)
    expect(mockCallTxMethod).toHaveBeenCalledWith({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: 123,
        target: { Id: options.address },
        amount: 1000000n
      }
    })
    expect(result).toBe('tx-result')
  })
})
