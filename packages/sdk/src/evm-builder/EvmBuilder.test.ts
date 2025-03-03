import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Signer } from 'ethers'
import { EvmBuilder } from './EvmBuilder'
import {
  transferMoonbeamEvm,
  transferMoonbeamToEth,
  validateAddress,
  type IPolkadotApi,
  type TCurrencyInputWithAmount
} from '@paraspell/sdk-core'

vi.mock('@paraspell/sdk-core', () => ({
  transferMoonbeamToEth: vi.fn(),
  transferMoonbeamEvm: vi.fn(),
  validateAddress: vi.fn()
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
    vi.resetAllMocks()
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
      .signer(signer)

    await builder.build()

    expect(validateAddress).toHaveBeenCalledWith(address, 'Ethereum')
    expect(transferMoonbeamToEth).toHaveBeenCalledWith({
      api: mockApi,
      from: 'Moonbeam',
      to: 'Ethereum',
      currency,
      address,
      signer
    })
  })

  it('should call transferMoonbeamEvm if from is not Moonbeam and to is not Ethereum', async () => {
    const builder = EvmBuilder(mockApi)
      .from('Darwinia')
      .to('AssetHubPolkadot')
      .currency(currency)
      .address(address)
      .signer(signer)

    await builder.build()

    expect(validateAddress).toHaveBeenCalledWith(address, 'AssetHubPolkadot')
    expect(transferMoonbeamEvm).toHaveBeenCalledWith({
      api: mockApi,
      from: 'Darwinia',
      to: 'AssetHubPolkadot',
      currency,
      address,
      signer
    })
  })
})
