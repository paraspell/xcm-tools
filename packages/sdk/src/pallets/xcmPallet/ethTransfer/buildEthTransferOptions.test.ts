import { describe, it, expect, vi } from 'vitest'
import { buildEthTransferOptions } from './buildEthTransferOptions'
import { findEthAsset } from './findEthAsset'
import { createContext } from './createContext'
import type { Context } from '@snowbridge/api'
import { toPolkadot } from '@snowbridge/api'
import type { TSerializeEthTransferOptions } from '../../../types'
import type { SendValidationResult } from '@snowbridge/api/dist/toPolkadot'
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
      validateSend: vi.fn()
    }
  }
})

vi.mock('./checkPlanFailure', () => ({
  checkPlanFailure: vi.fn()
}))

describe('buildEthTransferOptions', () => {
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

    const options: TSerializeEthTransferOptions = {
      currency: { symbol: 'ETH' },
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress',
      amount: '1000000'
    }

    const result = await buildEthTransferOptions(options)

    expect(result).toEqual({
      token: 'token123',
      destinationParaId: 1000,
      destinationFee: BigInt(500),
      amount: BigInt(1000)
    })
  })

  it('throws an error if asset is not found', async () => {
    vi.mocked(findEthAsset).mockImplementation(() => {
      throw new Error('Asset not found')
    })

    const options: TSerializeEthTransferOptions = {
      currency: { symbol: 'ETH' },
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress',
      amount: '1000000'
    }

    await expect(buildEthTransferOptions(options)).rejects.toThrow('Asset not found')
  })

  it('throws an error if validation fails', async () => {
    const mockAsset = { symbol: '', assetId: 'eth-asset-id' }
    vi.mocked(findEthAsset).mockReturnValue(mockAsset)
    vi.mocked(createContext).mockResolvedValue({
      config: {},
      ethereum: {},
      polkadot: {}
    } as Context)
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(toPolkadot).validateSend.mockResolvedValue({
      failure: {
        errors: [{ message: 'Insufficient funds' }]
      }
    } as SendValidationResult)

    const options: TSerializeEthTransferOptions = {
      currency: { symbol: 'ETH' },
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress',
      amount: '1000000'
    }

    await expect(buildEthTransferOptions(options)).rejects.toThrow('Failed to validate send')
  })
})
