/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { extractMultiAssetLoc, isAssetEqual } from '@paraspell/assets'
import {
  Parents,
  type TMultiLocation,
  type TNodePolkadotKusama,
  Version
} from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidParameterError } from '../../errors'
import { getParaId } from '../../nodes/config'
import { getTNode } from '../../nodes/getTNode'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { determineRelayChain } from '..'
import { addXcmVersionHeader } from '../addXcmVersionHeader'
import { assertHasLocation } from '../assertions'
import { createBeneficiary } from '../createBeneficiary'
import { createMultiAsset } from '../multiAsset'
import { localizeLocation } from '../multiLocation'
import { createExecuteXcm, getReserveParaId } from './createExecuteXcm'

vi.mock('../../nodes/config')
vi.mock('../../nodes/getTNode')
vi.mock('..')
vi.mock('../../pallets/xcmPallet/utils')
vi.mock('../addXcmVersionHeader')
vi.mock('../createBeneficiary')
vi.mock('../multiAsset')
vi.mock('../multiLocation')
vi.mock('../assertions')
vi.mock('@paraspell/assets', () => ({
  isAssetEqual: vi.fn(),
  extractMultiAssetLoc: vi.fn()
}))

describe('createExecuteXcm', () => {
  const version = Version.V4
  const mockApi = {} as any
  const mockDest = { parents: 0, interior: { X1: [{ Parachain: 2000 }] } } as TMultiLocation
  const mockBeneficiary = {
    parents: 0,
    interior: { X1: [{ AccountId32: { id: '0x123' } }] }
  } as TMultiLocation

  const baseInput = {
    api: mockApi,
    asset: {
      symbol: 'DOT',
      amount: '1000',
      multiLocation: { parents: Parents.ONE, interior: { X1: [{ Parachain: 1000 }] } }
    },
    scenario: 'ParaToPara',
    destination: 'Moonbeam',
    paraIdTo: 2000,
    address: '0xabc123'
  } as TPolkadotXCMTransferOptions<any, any>

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(createDestination).mockReturnValue(mockDest)
    vi.mocked(createBeneficiary).mockReturnValue(mockBeneficiary)
    vi.mocked(addXcmVersionHeader).mockImplementation(xcm => ({ [version]: xcm }))
    vi.mocked(assertHasLocation).mockImplementation(() => {})
    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')
    vi.mocked(getParaId).mockImplementation(node => {
      if (node === 'AssetHubPolkadot') return 1000
      if (node === 'Polkadot') return 0
      return 2000
    })
    vi.mocked(getTNode).mockReturnValue('AssetHubPolkadot' as TNodePolkadotKusama)

    vi.mocked(createMultiAsset).mockImplementation((_, amount, location) => ({
      id: location,
      fun: { Fungible: BigInt(amount) }
    }))

    vi.mocked(localizeLocation).mockImplementation((_, location) => {
      if (!location) return location
      return {
        ...location,
        parents: location.parents,
        interior: location.interior
      } as TMultiLocation
    })

    vi.mocked(extractMultiAssetLoc).mockImplementation((asset: any) => asset.id || asset)
  })

  describe('getReserveParaId', () => {
    it('should return parachain ID when asset has Parachain junction', () => {
      const location: TMultiLocation = {
        parents: Parents.ONE,
        interior: { X1: [{ Parachain: 1234 }] }
      }
      expect(getReserveParaId(location)).toBe(1234)
    })

    it('should return AssetHubPolkadot ID when asset has GlobalConsensus junction', () => {
      const location: TMultiLocation = {
        parents: Parents.TWO,
        interior: { X1: [{ GlobalConsensus: { Polkadot: null } }] }
      }
      expect(getReserveParaId(location)).toBe(1000)
    })

    it('should return Polkadot ID for relay chain location', () => {
      const location: TMultiLocation = {
        parents: Parents.ONE,
        interior: { Here: null }
      }
      expect(getReserveParaId(location)).toBe(0)
    })

    it('should return undefined for other locations', () => {
      const location: TMultiLocation = {
        parents: Parents.ZERO,
        interior: { X1: [{ GeneralIndex: 123 }] }
      }
      expect(getReserveParaId(location)).toBeUndefined()
    })
  })

  describe('error cases', () => {
    it('should throw when asset has no location', () => {
      vi.mocked(assertHasLocation).mockImplementation(() => {
        throw new InvalidParameterError('Asset has no location')
      })

      const input = {
        ...baseInput,
        asset: { symbol: 'TEST', amount: '1000' }
      } as TPolkadotXCMTransferOptions<any, any>

      expect(() => createExecuteXcm('AssetHubPolkadot', input, 100n, 50n, version)).toThrow(
        InvalidParameterError
      )
    })

    it('should throw when sending local reserve with custom fee on unsupported chain', () => {
      const input = {
        ...baseInput,
        asset: {
          ...baseInput.asset,
          multiLocation: { parents: Parents.ZERO, interior: { Here: null } } // Local asset
        },
        feeAsset: {
          multiLocation: { parents: Parents.ONE, interior: { X1: [{ Parachain: 999 }] } }
        }
      } as TPolkadotXCMTransferOptions<any, any>

      vi.mocked(isAssetEqual).mockReturnValue(false)
      vi.mocked(getParaId).mockImplementation(node => {
        if (node === 'Moonbeam') return 3000
        return 1000
      })

      expect(() => createExecuteXcm('Moonbeam', input, 100n, 50n, version)).toThrow(
        'Sending local reserve assets with custom fee asset is not yet supported for this chain.'
      )
    })
  })

  describe('basic transfer scenarios', () => {
    it('should create XCM for simple transfer without fee asset', () => {
      const executionFee = 100n
      const hopExecutionFee = 50n

      const result = createExecuteXcm(
        'AssetHubPolkadot',
        baseInput,
        executionFee,
        hopExecutionFee,
        version
      )

      const xcm = result[version] as any
      expect(xcm).toHaveLength(3)

      expect(xcm[0]).toHaveProperty('WithdrawAsset')
      const withdrawnAssets = xcm[0].WithdrawAsset
      expect(withdrawnAssets).toHaveLength(1)
      expect(withdrawnAssets[0].fun.Fungible).toBe(1000n)

      expect(xcm[1]).toHaveProperty('BuyExecution')
      expect(xcm[1].BuyExecution.weight_limit).toHaveProperty('Limited')
      expect(xcm[1].BuyExecution.weight_limit.Limited.ref_time).toBe(450n)

      expect(xcm[2]).toHaveProperty('DepositReserveAsset')
      const depositReserve = xcm[2].DepositReserveAsset
      expect(depositReserve.dest).toBe(mockDest)
      expect(depositReserve.xcm).toHaveLength(2)

      expect(depositReserve.xcm[0].BuyExecution.fees.fun.Fungible).toBe(850n) // 1000 - 100 - 50
      expect(depositReserve.xcm[0].BuyExecution.weight_limit).toBe('Unlimited')

      expect(depositReserve.xcm[1].DepositAsset.beneficiary).toBe(mockBeneficiary)
    })

    it('should create XCM with different fee asset', () => {
      const input = {
        ...baseInput,
        feeAsset: {
          multiLocation: { parents: Parents.ONE, interior: { X1: [{ Parachain: 999 }] } }
        }
      } as TPolkadotXCMTransferOptions<any, any>

      const result = createExecuteXcm('AssetHubPolkadot', input, 100n, 50n, version)
      const xcm = result[version] as any

      const withdrawnAssets = xcm[0].WithdrawAsset
      expect(withdrawnAssets).toHaveLength(2)

      const buyExecution = xcm[1].BuyExecution
      expect(buyExecution.fees.fun.Fungible).toBe(100n)

      const depositReserve = xcm[2].DepositReserveAsset
      expect(depositReserve.assets).toHaveProperty('Definite')
      expect(depositReserve.assets.Definite).toHaveLength(1)
      expect(depositReserve.assets.Definite[0].fun.Fungible).toBe(1000n)
    })
  })

  describe('reserve chain scenarios', () => {
    it('should create direct DepositAsset when destination is reserve', () => {
      const input = {
        ...baseInput,
        paraIdTo: 1000
      }

      const result = createExecuteXcm('AssetHubPolkadot', input, 100n, 50n, version)
      const xcm = result[version] as any

      expect(xcm[2]).toHaveProperty('DepositAsset')
      expect(xcm[2].DepositAsset.beneficiary).toBe(mockBeneficiary)
    })

    it('should create InitiateReserveWithdraw for intermediary reserve', () => {
      vi.mocked(getParaId).mockImplementation(node => {
        if (node === 'Moonbeam') return 3000
        if (node === 'AssetHubPolkadot') return 1000
        return 2000
      })

      const result = createExecuteXcm('Moonbeam', baseInput, 100n, 50n, version)
      const xcm = result[version] as any

      expect(xcm[2]).toHaveProperty('InitiateReserveWithdraw')
      const initiateWithdraw = xcm[2].InitiateReserveWithdraw

      expect(initiateWithdraw.reserve.parents).toBe(Parents.ONE)
      expect(initiateWithdraw.reserve.interior.X1[0].Parachain).toBe(1000)

      expect(initiateWithdraw.xcm).toHaveLength(2)
      expect(initiateWithdraw.xcm[0]).toHaveProperty('BuyExecution')
      expect(initiateWithdraw.xcm[1]).toHaveProperty('DepositReserveAsset')
    })
  })

  describe('asset sorting', () => {
    it('should sort assets correctly: Here > regular > GlobalConsensus', () => {
      const feeAsset = {
        multiLocation: {
          parents: Parents.TWO,
          interior: { X1: [{ GlobalConsensus: { Polkadot: null } }] }
        }
      }
      const mainAsset = {
        amount: '1000',
        multiLocation: { parents: Parents.ONE, interior: { Here: null } }
      }

      const input = { ...baseInput, asset: mainAsset, feeAsset } as TPolkadotXCMTransferOptions<
        any,
        any
      >

      const result = createExecuteXcm('AssetHubPolkadot', input, 100n, 50n, version)
      const xcm = result[version] as any

      const withdrawnAssets = xcm[0].WithdrawAsset
      expect(withdrawnAssets).toHaveLength(2)
    })

    it('should sort by GeneralIndex when present', () => {
      const asset1 = {
        amount: '1000',
        multiLocation: { parents: Parents.ZERO, interior: { X1: [{ GeneralIndex: 5 }] } }
      }
      const asset2 = {
        multiLocation: { parents: Parents.ZERO, interior: { X1: [{ GeneralIndex: 2 }] } }
      }

      const input = {
        ...baseInput,
        asset: asset1,
        feeAsset: asset2
      } as TPolkadotXCMTransferOptions<any, any>

      const result = createExecuteXcm('AssetHubPolkadot', input, 100n, 50n, version)
      const xcm = result[version] as any

      const withdrawnAssets = xcm[0].WithdrawAsset
      expect(withdrawnAssets).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('should handle same asset for main and fee', () => {
      vi.mocked(isAssetEqual).mockReturnValue(true)

      const input = {
        ...baseInput,
        feeAsset: baseInput.asset
      }

      const result = createExecuteXcm('AssetHubPolkadot', input, 100n, 50n, version)
      const xcm = result[version] as any

      const withdrawnAssets = xcm[0].WithdrawAsset
      expect(withdrawnAssets).toHaveLength(1)

      const depositReserve = xcm[2].DepositReserveAsset
      expect(depositReserve.assets).toHaveProperty('Wild')
      expect(depositReserve.assets.Wild.AllCounted).toBe(1)
    })

    it('should handle non-AssetHubPolkadot chains differently', () => {
      const result = createExecuteXcm('Moonbeam', baseInput, 100n, 50n, version)
      const xcm = result[version] as any

      const withdrawnAssets = xcm[0].WithdrawAsset
      expect(withdrawnAssets[0].id).toEqual(baseInput.asset.multiLocation)

      const buyExecution = xcm[1].BuyExecution
      expect(buyExecution.fees.id).toEqual(baseInput.asset.multiLocation)
    })

    it('should adjust amount for polkadot withdrawal quirk', () => {
      vi.mocked(getParaId).mockImplementation(node => {
        if (node === 'Moonbeam') return 3000
        if (node === 'AssetHubPolkadot') return 1000
        return 2000
      })

      const result = createExecuteXcm('Moonbeam', baseInput, 100n, 50n, version)
      const xcm = result[version] as any

      const initiateWithdraw = xcm[2].InitiateReserveWithdraw
      const nestedBuyExecution = initiateWithdraw.xcm[0].BuyExecution

      expect(nestedBuyExecution.fees.fun.Fungible).toBe(998n) // 1000 - 2
    })
  })
})
