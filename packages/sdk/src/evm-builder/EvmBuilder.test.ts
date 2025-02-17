import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Signer } from 'ethers'
import { EvmBuilder } from './EvmBuilder'
import {
  transferMoonbeamToEth,
  type IPolkadotApi,
  type TCurrencyInputWithAmount,
  type TNodePolkadotKusama
} from '@paraspell/sdk-core'

vi.mock('@paraspell/sdk-core', () => ({
  transferMoonbeamToEth: vi.fn(),
  validateAddress: vi.fn()
}))

const mockApi = {
  init: vi.fn(),
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

describe('EvmBuilderClass', () => {
  let signer: Signer
  let node: TNodePolkadotKusama
  let currency: TCurrencyInputWithAmount
  let address: string

  beforeEach(() => {
    signer = {} as Signer
    node = {} as TNodePolkadotKusama
    currency = {} as TCurrencyInputWithAmount
    address = '0x1234567890abcdef'
  })

  it('should throw an error if required parameters are missing', async () => {
    const builder = EvmBuilder(mockApi)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: from')
  })

  it('should return the builder instance when setting parameters', () => {
    const builder = EvmBuilder(mockApi)
    const result = builder
      .from('Moonbeam')
      .to(node)
      .currency(currency)
      .address(address)
      .signer(signer)

    expect(result).toBe(builder)
  })

  it('should throw an error if build is called without all required parameters', async () => {
    const builder = EvmBuilder(mockApi).from('Moonbeam').to(node).currency(currency)

    await expect(builder.build()).rejects.toThrow('Builder object is missing parameter: address')
  })

  it('should call transferMoonbeamToEth if from is Moonbeam and to is Ethereum', async () => {
    const builder = EvmBuilder(mockApi)
      .from('Moonbeam')
      .to('Ethereum')
      .currency(currency)
      .address(address)
      .signer(signer)

    await builder.build()

    expect(transferMoonbeamToEth).toHaveBeenCalled()
  })
})
