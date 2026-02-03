import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type KiltSpiritnet from './KiltSpiritnet'

vi.mock('../../pallets/polkadotXcm')

describe('KiltSpiritnet', () => {
  let chain: KiltSpiritnet<unknown, unknown, unknown>

  const mockInput = {
    scenario: 'ParaToPara',
    assetInfo: {
      symbol: 'KILT',
      amount: 100n
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'KiltSpiritnet'>('KiltSpiritnet')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('KiltSpiritnet')
    expect(chain.info).toBe('kilt')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V4)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should throw an error if trying to transfer ParaToPara with non-native asset', () => {
    expect(() =>
      chain.transferPolkadotXCM({
        ...mockInput,
        assetInfo: {
          ...mockInput.assetInfo,
          symbol: 'DOT'
        }
      })
    ).toThrow(ScenarioNotSupportedError)
  })

  it('should return false for isRelayToParaEnabled', () => {
    expect(chain.isRelayToParaEnabled()).toBe(false)
  })
})
