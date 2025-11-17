import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import CoretimePolkadot from './CoretimePolkadot'

vi.mock('../../pallets/polkadotXcm')

describe('CoretimePolkadot', () => {
  let chain: CoretimePolkadot<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'CoretimePolkadot'>('CoretimePolkadot')
  })

  it('should initialize with correct values', () => {
    expect(chain).toBeInstanceOf(CoretimePolkadot)
    expect(chain.chain).toBe('CoretimePolkadot')
    expect(chain.info).toBe('polkadotCoretime')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara scenario', () => {
    const input = { scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => chain.transferPolkadotXCM(input)).toThrowError(ScenarioNotSupportedError)
  })

  it('canReceiveFrom returns false for Hydration and Moonbeam', () => {
    expect(chain.canReceiveFrom('Hydration')).toBe(false)
    expect(chain.canReceiveFrom('Moonbeam')).toBe(false)
  })

  it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
    const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input, 'limited_teleport_assets', 'Unlimited')
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = chain.getRelayToParaOverrides()

    expect(result).toEqual({
      transferType: 'teleport'
    })
  })
})
