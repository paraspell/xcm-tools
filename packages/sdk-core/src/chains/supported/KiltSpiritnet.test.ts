import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type KiltSpiritnet from './KiltSpiritnet'

vi.mock('../../pallets/polkadotXcm')

describe('KiltSpiritnet', () => {
  let kiltSpiritnet: KiltSpiritnet<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToPara',
    assetInfo: {
      symbol: 'KILT',
      amount: 100n
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    kiltSpiritnet = getChain<unknown, unknown, 'KiltSpiritnet'>('KiltSpiritnet')
  })

  it('should initialize with correct values', () => {
    expect(kiltSpiritnet.chain).toBe('KiltSpiritnet')
    expect(kiltSpiritnet.info).toBe('kilt')
    expect(kiltSpiritnet.ecosystem).toBe('Polkadot')
    expect(kiltSpiritnet.version).toBe(Version.V4)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets', async () => {
    await kiltSpiritnet.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should throw an error if trying to transfer ParaToPara with non-native asset', () => {
    expect(() =>
      kiltSpiritnet.transferPolkadotXCM({
        ...mockInput,
        assetInfo: {
          ...mockInput.assetInfo,
          symbol: 'DOT'
        }
      })
    ).toThrow(ScenarioNotSupportedError)
  })

  it('should throw ChainNotSupportedError for transferRelayToPara', () => {
    expect(() => kiltSpiritnet.transferRelayToPara()).toThrow(ChainNotSupportedError)
  })
})
