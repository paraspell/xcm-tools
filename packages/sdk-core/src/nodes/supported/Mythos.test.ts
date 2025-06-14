import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import { handleToAhTeleport } from '../../utils/transfer'
import type Mythos from './Mythos'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../utils/transfer', () => ({
  handleToAhTeleport: vi.fn()
}))

describe('Mythos', () => {
  let mythos: Mythos<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'MYTH', amount: '100' },
    scenario: 'ParaToPara',
    destination: 'Acala'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    mythos = getNode<unknown, unknown, 'Mythos'>('Mythos')
  })

  it('should initialize with correct values', () => {
    expect(mythos.node).toBe('Mythos')
    expect(mythos.info).toBe('mythos')
    expect(mythos.type).toBe('polkadot')
    expect(mythos.version).toBe(Version.V4)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for non-AssetHubPolkadot destination', async () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')
    await mythos.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for AssetHubPolkadot destination', async () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')

    await mythos.transferPolkadotXCM({ ...mockInput, destination: 'AssetHubPolkadot' })

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      { ...mockInput, destination: 'AssetHubPolkadot' },
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', async () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >

    await expect(mythos.transferPolkadotXCM(invalidInput)).rejects.toThrowError(
      ScenarioNotSupportedError
    )
  })

  it('should throw InvalidCurrencyError for unsupported currency', async () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('NOT_MYTH')

    await expect(mythos.transferPolkadotXCM(mockInput)).rejects.toThrowError(
      new InvalidCurrencyError(`Node Mythos does not support currency MYTH`)
    )
  })

  it('should handle to Ah teleport', async () => {
    await mythos.transferPolkadotXCM({ ...mockInput, destination: 'AssetHubPolkadot' })
    expect(handleToAhTeleport).toHaveBeenCalled()
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => mythos.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
