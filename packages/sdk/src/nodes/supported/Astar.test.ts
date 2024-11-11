import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput, PolkadotXCMTransferInput } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import XTokensTransferImpl from '../xTokens'
import type Astar from './Astar'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Astar', () => {
  let astar: Astar<ApiPromise, Extrinsic>
  const mockPolkadotXCMInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'DOT' },
    amount: '100'
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  const mockXTokensInput = {
    asset: { assetId: '123' },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    astar = getNode<ApiPromise, Extrinsic, 'Astar'>('Astar')
  })

  it('should initialize with correct values', () => {
    expect(astar.node).toBe('Astar')
    expect(astar.name).toBe('astar')
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

    expect(spy).toHaveBeenCalledWith(mockXTokensInput, BigInt(123))
  })
})
