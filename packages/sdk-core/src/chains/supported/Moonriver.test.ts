import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Moonriver from './Moonriver'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('Moonriver', () => {
  let chain: Moonriver<unknown, unknown>

  const api = {
    createAccountId: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockInput = {
    api,
    version: Version.V5,
    assetInfo: {
      symbol: 'MOVR',
      amount: 100n
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Moonriver'>('Moonriver')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Moonriver')
    expect(chain.info).toBe('moonriver')
    expect(chain.type).toBe('kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should use correct location when transfering native asset', async () => {
    const mockInputNative = {
      ...mockInput,
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'MOVR', amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(mockInputNative)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockInputNative,
        asset: {
          fun: {
            Fungible: mockInput.assetInfo.amount
          },
          id: {
            parents: 0,
            interior: {
              X1: {
                PalletInstance: 10
              }
            }
          }
        }
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should use correct location when transfering DOT to relay', async () => {
    const mockInputDot = {
      ...mockInput,
      scenario: 'ParaToRelay',
      assetInfo: { symbol: 'DOT', amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(mockInputDot)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockInputDot,
        asset: {
          fun: {
            Fungible: mockInput.assetInfo.amount
          },
          id: DOT_LOCATION
        }
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should use correct location when transfering USDT', async () => {
    const asset = {
      symbol: 'USDT',
      location: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 1000
            },
            {
              PalletInstance: 50
            },
            {
              GeneralIndex: 1984
            }
          ]
        }
      },
      amount: 100n
    }
    const mockInputUsdt = {
      ...mockInput,
      scenario: 'ParaToPara',
      assetInfo: asset
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(mockInputUsdt)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockInputUsdt,
        asset: {
          fun: {
            Fungible: mockInput.assetInfo.amount
          },
          id: asset.location
        }
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = chain.getRelayToParaOverrides()
    expect(result).toEqual({
      method: 'limited_reserve_transfer_assets',
      includeFee: true
    })
  })
})
