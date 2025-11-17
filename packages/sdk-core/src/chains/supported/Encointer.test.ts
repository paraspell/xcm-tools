import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Encointer from './Encointer'

vi.mock('../../pallets/polkadotXcm')

describe('Encointer', () => {
  let chain: Encointer<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToRelay',
    assetInfo: { symbol: 'KSM', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Encointer'>('Encointer')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Encointer')
    expect(chain.info).toBe('encointer')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for ParaToRelay scenario', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >
    expect(() => chain.transferPolkadotXCM(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(chain.chain, 'ParaToPara')
    )
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = chain.getRelayToParaOverrides()
    expect(result).toEqual({
      transferType: 'teleport'
    })
  })
})
