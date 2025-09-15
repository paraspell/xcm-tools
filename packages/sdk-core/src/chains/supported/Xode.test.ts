import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Xode from './Subsocial'

vi.mock('../../pallets/polkadotXcm')

describe('Xode', () => {
  let chain: Xode<unknown, unknown>

  const options = {
    scenario: 'ParaToPara',
    destChain: 'AssetHubPolkadot',
    assetInfo: { symbol: 'XYZ', location: {} }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Xode'>('Xode')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Xode')
    expect(chain.info).toBe('xode')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V4)
  })

  it('should call transferPolkadotXCM with limited_reserve_transfer_assets', async () => {
    await chain.transferPolkadotXCM(options)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...options,
        asset: {
          fun: {
            Fungible: undefined
          },
          id: {}
        }
      },
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('transferPolkadotXCM should throw IncompatibleChainsError for unsupported destChain', () => {
    expect(() => chain.transferPolkadotXCM({ ...options, destChain: 'Moonbeam' })).toThrow(
      'Xode chain only supports transfers to / from AssetHubPolkadot'
    )
  })
})
