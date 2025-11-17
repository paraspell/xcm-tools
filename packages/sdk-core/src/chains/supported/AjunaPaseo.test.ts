import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type AjunaPaseo from './AjunaPaseo'

vi.mock('../../pallets/polkadotXcm')

describe('AjunaPaseo', () => {
  let chain: AjunaPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'AjunaPaseo'>('AjunaPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('AjunaPaseo')
    expect(chain.info).toBe('Ajuna(paseo)')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V4)
  })

  it('should not suppoert ParaToRelay scenario', () => {
    const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('should only support native currency', () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'XYZ' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => chain.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
  })

  it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'AJUN' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      input,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should throw ChainNotSupportedError when calling transferRelayToPara', () => {
    expect(() => chain.transferRelayToPara()).toThrowError(ChainNotSupportedError)
  })
})
