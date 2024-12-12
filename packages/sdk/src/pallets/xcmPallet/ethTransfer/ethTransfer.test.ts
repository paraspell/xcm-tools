import { describe, it, expect, vi } from 'vitest'
import { findEthAsset } from './findEthAsset'
import { createContext } from './createContext'
import type { Context } from '@snowbridge/api'
import { toPolkadot } from '@snowbridge/api'
import type { TEvmBuilderOptions } from '../../../types'
import type { SendValidationResult } from '@snowbridge/api/dist/toPolkadot'
import transferEthToPolkadot from './ethTransfer'
import type { AbstractProvider, Signer } from 'ethers'
import { getParaId } from '../../../nodes/config'

vi.mock('./findEthAsset', () => ({
  findEthAsset: vi.fn()
}))

vi.mock('./createContext', () => ({
  createContext: vi.fn()
}))

vi.mock('../../../nodes/config', () => ({
  getParaId: vi.fn()
}))

vi.mock('@snowbridge/api', () => ({
  toPolkadot: {
    validateSend: vi.fn()
  }
}))

vi.mock('@snowbridge/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@snowbridge/api')>()
  return {
    ...actual,
    toPolkadot: {
      validateSend: vi.fn(),
      send: vi.fn()
    }
  }
})

vi.mock('./checkPlanFailure', () => ({
  checkPlanFailure: vi.fn()
}))

describe('transferEthToPolkadot', () => {
  it('successfully returns serialized eth transfer options', async () => {
    const mockAsset = { symbol: '', assetId: 'eth-asset-id' }
    vi.mocked(findEthAsset).mockReturnValue(mockAsset)
    vi.mocked(createContext).mockResolvedValue({
      config: {},
      ethereum: {},
      polkadot: {}
    } as Context)
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(toPolkadot).validateSend.mockResolvedValue({
      success: {
        token: 'token123',
        destinationParaId: 1000,
        destinationFee: BigInt(500),
        amount: BigInt(1000)
      }
    } as SendValidationResult)
    vi.mocked(toPolkadot).send.mockResolvedValue({})

    const mockProvider = {} as AbstractProvider

    const options: TEvmBuilderOptions = {
      currency: { symbol: 'ETH', amount: '1000000' },
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: {} as Signer
    }

    const result = await transferEthToPolkadot(mockProvider, options)

    expect(result).toEqual({
      result: {},
      plan: {
        success: {
          token: 'token123',
          destinationParaId: 1000,
          destinationFee: BigInt(500),
          amount: BigInt(1000)
        }
      }
    })
  })
})
