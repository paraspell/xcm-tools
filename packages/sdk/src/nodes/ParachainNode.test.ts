import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../errors'
import { isTMultiLocation } from '../pallets/xcmPallet/utils'
import { TMultiLocation, TNode, TSendInternalOptions } from '../types'
import { getNode } from '../utils'
import AssetHubPolkadot from './supported/AssetHubPolkadot'
import { ApiPromise } from '@polkadot/api'
import { verifyMultiLocation } from '../utils/verifyMultiLocation'

vi.mock('../pallets/xcmPallet/utils', async () => {
  const actual = await import('../pallets/xcmPallet/utils')
  return {
    ...actual,
    isTMultiLocation: vi.fn()
  }
})

vi.mock('../utils/verifyMultiLocation', () => ({
  verifyMultiLocation: vi.fn()
}))

describe('ParachainNode', () => {
  let parachainNode: AssetHubPolkadot
  const mockNode: TNode = 'AssetHubPolkadot'
  const mockMultiLocation: TMultiLocation = {
    parents: 1,
    interior: {
      X1: {
        PalletInstance: 1
      }
    }
  }

  beforeEach(() => {
    parachainNode = getNode(mockNode)
  })

  it('should throw InvalidCurrencyError if multi-location is invalid', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(true)
    vi.mocked(verifyMultiLocation).mockReturnValue(false)

    const options = {
      api: {
        createType: () => ({
          toHex: () => '0x123'
        })
      } as unknown as ApiPromise,
      overridedCurrencyMultiLocation: mockMultiLocation
    } as TSendInternalOptions

    expect(() => {
      parachainNode.transfer({ ...options })
    }).toThrowError(new InvalidCurrencyError('Provided Multi-location is not a valid currency.'))
  })

  it('should not throw error if multi-location is valid', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(true)
    vi.mocked(verifyMultiLocation).mockReturnValue(true)

    vi.spyOn(parachainNode, 'transferPolkadotXCM').mockResolvedValue({
      module: 'xcmPallet',
      section: 'reserveTransferAssets',
      parameters: []
    })

    const options = {
      api: {
        createType: () => ({
          toHex: () => '0x123'
        })
      } as unknown as ApiPromise,
      overridedCurrencyMultiLocation: mockMultiLocation
    } as TSendInternalOptions

    expect(() => {
      parachainNode.transfer({ ...options })
    }).not.toThrow()
  })

  it('should not throw error if overridedCurrencyMultiLocation is not a valid multi-location type', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)

    vi.spyOn(parachainNode, 'transferPolkadotXCM').mockResolvedValue({
      module: 'xcmPallet',
      section: 'reserveTransferAssets',
      parameters: []
    })

    const options = {
      api: {
        createType: () => ({
          toHex: () => '0x123'
        })
      } as unknown as ApiPromise,
      overridedCurrencyMultiLocation: mockMultiLocation
    } as TSendInternalOptions

    expect(() => {
      parachainNode.transfer({ ...options })
    }).not.toThrow()
  })
})
