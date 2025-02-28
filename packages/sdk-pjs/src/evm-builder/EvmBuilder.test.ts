import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AbstractProvider, Signer } from 'ethers'
import { EvmBuilder } from './EvmBuilder'
import {
  type IPolkadotApi,
  type TCurrencyInputWithAmount,
  type TNodePolkadotKusama
} from '@paraspell/sdk-core'

vi.mock('../../pallets/xcmPallet/ethTransfer/ethTransfer', () => ({
  transferEthToPolkadot: vi.fn().mockResolvedValue({
    result: {
      success: {
        ethereum: {
          blockHash: '0x1234567890abcdef'
        }
      }
    }
  })
}))

vi.mock('@paraspell/sdk-core', () => ({
  validateAddress: vi.fn().mockReturnValue(true),
  transferMoonbeamEvm: vi.fn().mockResolvedValue({
    result: {
      success: {
        ethereum: {
          blockHash: '0x1234567890abcdef'
        }
      }
    }
  })
}))

const mockApi = {
  init: vi.fn(),
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

describe('EvmBuilderClass', () => {
  let provider: AbstractProvider
  let signer: Signer
  let node: TNodePolkadotKusama
  let currency: TCurrencyInputWithAmount
  let address: string

  beforeEach(() => {
    provider = {} as AbstractProvider
    signer = {} as Signer
    node = {} as TNodePolkadotKusama
    currency = {} as TCurrencyInputWithAmount
    address = '0x1234567890abcdef'
  })

  it('should throw an error if required parameters are missing', async () => {
    const builder = EvmBuilder(mockApi, provider)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: from')
  })

  it('should return the builder instance when setting parameters', () => {
    const builder = EvmBuilder(mockApi, provider)
    const result = builder
      .from('Ethereum')
      .to(node)
      .currency(currency)
      .address(address)
      .signer(signer)

    expect(result).toBe(builder)
  })

  it('should return the builder instance when setting parameters from Darwinia', () => {
    const builder = EvmBuilder(mockApi, provider)
    const result = builder
      .from('Darwinia')
      .to(node)
      .currency(currency)
      .address(address)
      .signer(signer)
      .build()

    expect(result).toBeDefined()
  })

  it('should throw an error if build is called without all required parameters', async () => {
    const builder = EvmBuilder(mockApi, provider).from('Ethereum').to(node).currency(currency)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: address')
  })
})
