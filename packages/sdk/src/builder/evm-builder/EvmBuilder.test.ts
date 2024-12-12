import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AbstractProvider, Signer } from 'ethers'
import type { TCurrencyCoreV1WithAmount, TNodePolkadotKusama } from '../../types'
import type { TEvmBuilderOptions } from '../../types/TBuilder'
import transferEthToPolkadot from '../../pallets/xcmPallet/ethTransfer/ethTransfer'
import { EvmBuilder } from './EvmBuilder'

vi.mock('../../pallets/xcmPallet/ethTransfer/ethTransfer', () => ({
  default: vi.fn()
}))

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
    const builder = EvmBuilder(provider)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: to')
  })

  it('should set all required parameters and call transferEthToPolkadot', async () => {
    const builder = EvmBuilder(provider).to(node).currency(currency).address(address).signer(signer)

    await builder.build()

    expect(transferEthToPolkadot).toHaveBeenCalledWith(provider, {
      to: node,
      currency,
      address,
      signer
    } as TEvmBuilderOptions)
  })

  it('should return the builder instance when setting parameters', () => {
    const builder = EvmBuilder(provider)
    const result = builder.to(node).currency(currency).address(address).signer(signer)

    expect(result).toBe(builder)
  })

  it('should throw an error if build is called without all required parameters', async () => {
    const builder = EvmBuilder(provider).to(node).currency(currency)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: address')
  })
})
