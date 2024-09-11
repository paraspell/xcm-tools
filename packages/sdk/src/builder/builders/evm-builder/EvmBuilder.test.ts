import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AbstractProvider, Signer } from 'ethers'
import { TCurrencyCore, TNodePolkadotKusama } from '../../../types'
import { TEvmBuilderOptions } from '../../../types/TBuilder'
import transferEthToPolkadot from '../../../pallets/xcmPallet/ethTransfer/ethTransfer'
import { EvmBuilder } from './EvmBuilder'

vi.mock('../../../pallets/xcmPallet/ethTransfer/ethTransfer', () => ({
  default: vi.fn()
}))

describe('EvmBuilderClass', () => {
  let provider: AbstractProvider
  let signer: Signer
  let node: TNodePolkadotKusama
  let currency: TCurrencyCore
  let address: string
  let amount: string

  beforeEach(() => {
    provider = {} as AbstractProvider
    signer = {} as Signer
    node = {} as TNodePolkadotKusama
    currency = {} as TCurrencyCore
    address = '0x1234567890abcdef'
    amount = '100'
  })

  it('should throw an error if required parameters are missing', async () => {
    const builder = EvmBuilder(provider)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: to')
  })

  it('should set all required parameters and call transferEthToPolkadot', async () => {
    const builder = EvmBuilder(provider)
      .to(node)
      .amount(amount)
      .currency(currency)
      .address(address)
      .signer(signer)

    await builder.build()

    expect(transferEthToPolkadot).toHaveBeenCalledWith(provider, {
      to: node,
      amount,
      currency,
      address,
      signer
    } as TEvmBuilderOptions)
  })

  it('should return the builder instance when setting parameters', () => {
    const builder = EvmBuilder(provider)
    const result = builder
      .to(node)
      .amount(amount)
      .currency(currency)
      .address(address)
      .signer(signer)

    expect(result).toBe(builder)
  })

  it('should throw an error if build is called without all required parameters', async () => {
    const builder = EvmBuilder(provider).to(node).amount(amount).currency(currency)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: address')
  })
})
