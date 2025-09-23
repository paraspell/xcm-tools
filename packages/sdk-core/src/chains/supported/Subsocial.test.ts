import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TSendInternalOptions } from '../../types'
import { getChain } from '../../utils'
import type Subsocial from './Subsocial'

vi.mock('../../pallets/polkadotXcm')

describe('Subsocial', () => {
  let chain: Subsocial<unknown, unknown>

  const sendOptions = {} as unknown as TSendInternalOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Subsocial'>('Subsocial')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Subsocial')
    expect(chain.info).toBe('subsocial')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V3)
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
      assetInfo: { symbol: 'SUB' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(input)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      input,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('isSendingTempDisabled should return true', () => {
    expect(chain.isSendingTempDisabled(sendOptions)).toBe(true)
  })

  it('isReceivingTempDisabled should return true', () => {
    expect(chain.isReceivingTempDisabled('ParaToPara')).toBe(true)
  })
})
