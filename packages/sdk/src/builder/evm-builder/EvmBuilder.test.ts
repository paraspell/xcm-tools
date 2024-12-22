import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AbstractProvider, Signer } from 'ethers'
import type { TCurrencyCoreV1WithAmount, TNodePolkadotKusama } from '../../types'
import { EvmBuilder } from './EvmBuilder'
import { transferEthToPolkadot } from '../../pallets/xcmPallet'
import type { IPolkadotApi } from '../../api'
import type { Extrinsic, TPjsApi } from '../../pjs'

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

const mockApi = {
  init: vi.fn(),
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<TPjsApi, Extrinsic>

describe('EvmBuilderClass', () => {
  let provider: AbstractProvider
  let signer: Signer
  let node: TNodePolkadotKusama
  let currency: TCurrencyCoreV1WithAmount
  let address: string

  beforeEach(() => {
    provider = {} as AbstractProvider
    signer = {} as Signer
    node = {} as TNodePolkadotKusama
    currency = {} as TCurrencyCoreV1WithAmount
    address = '0x1234567890abcdef'
  })

  it('should throw an error if required parameters are missing', async () => {
    const builder = EvmBuilder(mockApi, provider)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: from')
  })

  it('should set all required parameters and call transferEthToPolkadot', async () => {
    const builder = EvmBuilder(mockApi, provider)
      .from('Ethereum')
      .to(node)
      .currency(currency)
      .address(address)
      .signer(signer)

    await builder.build()

    expect(transferEthToPolkadot).toHaveBeenCalledWith({
      api: mockApi,
      provider,
      from: 'Ethereum',
      to: node,
      currency,
      address,
      signer
    })
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

  it('should throw an error if build is called without all required parameters', async () => {
    const builder = EvmBuilder(mockApi, provider).from('Ethereum').to(node).currency(currency)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: address')
  })
})
