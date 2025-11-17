import {
  InvalidParameterError,
  type IPolkadotApi,
  type TCurrencyInputWithAmount,
  validateAddress
} from '@paraspell/sdk-core'
import type { Signer } from 'ethers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferEthToPolkadot } from '../ethTransfer'
import { isEthersSigner } from '../utils'
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
  transferMoonbeamEvm: vi.fn(),
  InvalidParameterError: class InvalidParameterError extends Error {}
}))

vi.mock('../utils', () => ({
  isEthersSigner: vi.fn()
}))

const mockApi = {
  init: vi.fn(),
  deserializeExtrinsics: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

describe('EvmBuilderClass', () => {
  let signer: Signer
  let currency: TCurrencyInputWithAmount
  let address: string

  beforeEach(() => {
    signer = {} as Signer
    currency = {} as TCurrencyInputWithAmount
    address = '0x1234567890abcdef'
    vi.mocked(isEthersSigner).mockReturnValue(true)
  })

  it('should call transferMoonbeamToEth if from is Moonbeam and to is Ethereum', async () => {
    const builder = EvmBuilder(mockApi)
      .from('Moonbeam')
      .to('Ethereum')
      .currency(currency)
      .address(address)
      .ahAddress(address)
      .signer(signer)

    await expect(builder.build()).rejects.toThrow(InvalidParameterError)

    expect(validateAddress).toHaveBeenCalledWith(mockApi, address, 'Ethereum')
  })

  it('should call transferMoonbeamEvm if from is Moonbeam, Moonriver, or Darwinia', async () => {
    const builder = EvmBuilder(mockApi)
      .from('Moonbeam')
      .to('Polkadot')
      .currency(currency)
      .address(address)
      .ahAddress(address)
      .signer(signer)

    await expect(builder.build()).rejects.toThrow(InvalidParameterError)

    expect(validateAddress).toHaveBeenCalledWith(mockApi, address, 'Polkadot')
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

    expect(validateAddress).toHaveBeenCalledWith(mockApi, address, 'Polkadot')
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
