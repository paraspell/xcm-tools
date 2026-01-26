import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type EnergyWebX from './EnergyWebX'

vi.mock('../../pallets')
vi.mock('../../pallets/polkadotXcm')

describe('EnergyWebX', () => {
  let chain: EnergyWebX<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'EnergyWebX'>('EnergyWebX')
    vi.clearAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('EnergyWebX')
    expect(chain.info).toBe('ewx')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V3)
  })

  it('should handle ParaToPara transfers correctly', async () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'DOT', amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input, 'reserve_transfer_assets')
  })

  it('should throw ScenarioNotSupportedError for non-ParaToPara scenarios', () => {
    const scenarios = ['RelayToPara', 'ParaToRelay'] as const

    scenarios.forEach(scenario => {
      const input = {
        scenario,
        assetInfo: { symbol: 'DOT', amount: 100n }
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })
  })

  it('should return false for isRelayToParaEnabled', () => {
    expect(chain.isRelayToParaEnabled()).toBe(false)
  })

  it('should query balance foreign with asset location and address', async () => {
    const queryState = vi.fn().mockResolvedValue({ balance: 321n })

    const api = { queryState } as unknown as IPolkadotApi<unknown, unknown>
    const asset = { location: { parents: 0, interior: 'Here' } } as TAssetInfo
    const address = '5FbalanceAddr'

    const balance = await chain.getBalanceForeign(api, address, asset)

    expect(queryState).toHaveBeenCalledWith({
      module: 'Assets',
      method: 'Account',
      params: [asset.location, address]
    })
    expect(balance).toBe(321n)
  })
})
