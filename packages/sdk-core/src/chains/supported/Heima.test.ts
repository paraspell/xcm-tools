import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import Heima from './Heima'

vi.mock('../../pallets/polkadotXcm')

describe('Heima', () => {
  let chain: Heima<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Heima'>('Heima')
  })

  it('should be instantiated correctly', () => {
    expect(chain).toBeInstanceOf(Heima)
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Heima')
    expect(chain.info).toBe('heima')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should not suppoert ParaToRelay scenario', () => {
    const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown,
      unknown
    >
    expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('should only support native currency', () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'XYZ' }
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>
    expect(() => chain.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
  })

  it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'HEI' }
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })
})
