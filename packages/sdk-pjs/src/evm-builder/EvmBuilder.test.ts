import {
  type IPolkadotApi,
  type TCurrencyInputWithAmount,
  transferMoonbeamEvm,
  transferMoonbeamToEth,
  validateAddress
} from '@paraspell/sdk-core'
import type { Signer } from 'ethers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferEthToPolkadot } from '../ethTransfer'
import { EvmBuilder } from './EvmBuilder'

vi.mock('../ethTransfer', () => ({
  transferEthToPolkadot: vi.fn().mockResolvedValue({
    response: {
      hash: '0x1234567890abcdef'
    }
  })
}))

vi.mock('@paraspell/sdk-core', () => ({
  validateAddress: vi.fn().mockReturnValue(true),
  transferMoonbeamToEth: vi.fn(),
  transferMoonbeamEvm: vi.fn()
}))

const mockApi = {
  init: vi.fn(),
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

describe('EvmBuilderClass', () => {
  let signer: Signer
  let currency: TCurrencyInputWithAmount
  let address: string

  beforeEach(() => {
    signer = {} as Signer
    currency = {} as TCurrencyInputWithAmount
    address = '0x1234567890abcdef'
  })

  it('should call transferMoonbeamToEth if from is Moonbeam and to is Ethereum', async () => {
    const builder = EvmBuilder(mockApi)
      .from('Moonbeam')
      .to('Ethereum')
      .currency(currency)
      .address(address)
      .ahAddress(address)
      .signer(signer)

    await builder.build()

    expect(validateAddress).toHaveBeenCalledWith(address, 'Ethereum')
    expect(transferMoonbeamToEth).toHaveBeenCalledWith({
      api: mockApi,
      from: 'Moonbeam',
      to: 'Ethereum',
      currency,
      address,
      ahAddress: address,
      signer
    })
  })

  it('should call transferMoonbeamEvm if from is Moonbeam, Moonriver, or Darwinia', async () => {
    const builder = EvmBuilder(mockApi)
      .from('Moonbeam')
      .to('Polkadot')
      .currency(currency)
      .address(address)
      .ahAddress(address)
      .signer(signer)

    await builder.build()

    expect(validateAddress).toHaveBeenCalledWith(address, 'Polkadot')
    expect(transferMoonbeamEvm).toHaveBeenCalledWith({
      api: mockApi,
      from: 'Moonbeam',
      to: 'Polkadot',
      currency,
      address,
      ahAddress: address,
      signer
    })
  })

  it('should call transferEthToPolkadot if from is Ethereum', async () => {
    const builder = EvmBuilder(mockApi)
      .from('Ethereum')
      .to('AssetHubPolkadot')
      .currency(currency)
      .address(address)
      .ahAddress(address)
      .signer(signer)

    await builder.build()

    expect(validateAddress).toHaveBeenCalledWith(address, 'Polkadot')
    expect(transferEthToPolkadot).toHaveBeenCalledWith({
      api: mockApi,
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      currency,
      address,
      ahAddress: address,
      signer
    })
  })
})
