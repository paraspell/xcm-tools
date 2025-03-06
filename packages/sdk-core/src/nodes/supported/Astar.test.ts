import { beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import XTokensTransferImpl from '../../pallets/xTokens'
import type { TPolkadotXCMTransferOptions, TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Astar from './Astar'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Astar', () => {
  let astar: Astar<unknown, unknown>
  const mockPolkadotXCMInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'DOT', amount: '100' }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  const mockXTokensInput = {
    asset: { assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    astar = getNode<unknown, unknown, 'Astar'>('Astar')
  })

  it('should initialize with correct values', () => {
    expect(astar.node).toBe('Astar')
    expect(astar.info).toBe('astar')
    expect(astar.type).toBe('polkadot')
    expect(astar.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with reserveTransferAssets for ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await astar.transferPolkadotXCM(mockPolkadotXCMInput)

    expect(spy).toHaveBeenCalledWith(mockPolkadotXCMInput, 'reserve_transfer_assets')
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    astar.transferXTokens(mockXTokensInput)

    expect(spy).toHaveBeenCalledWith(mockXTokensInput, 123n)
  })
})
