import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Mythos from './Mythos'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('Mythos', () => {
  let mythos: Mythos<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'MYTH', amount: '100' },
    scenario: 'ParaToPara',
    destination: 'Acala'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    mythos = getNode<unknown, unknown, 'Mythos'>('Mythos')
  })

  it('should initialize with correct values', () => {
    expect(mythos.node).toBe('Mythos')
    expect(mythos.info).toBe('mythos')
    expect(mythos.type).toBe('polkadot')
    expect(mythos.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for non-AssetHubPolkadot destination', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')

    await mythos.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_reserve_transfer_assets', 'Unlimited')
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for AssetHubPolkadot destination', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')

    await mythos.transferPolkadotXCM({ ...mockInput, destination: 'AssetHubPolkadot' })

    expect(spy).toHaveBeenCalledWith(
      { ...mockInput, destination: 'AssetHubPolkadot' },
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >

    expect(() => mythos.transferPolkadotXCM(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should throw InvalidCurrencyError for unsupported currency', () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('NOT_MYTH')

    expect(() => mythos.transferPolkadotXCM(mockInput)).toThrowError(
      new InvalidCurrencyError(`Node Mythos does not support currency MYTH`)
    )
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => mythos.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
