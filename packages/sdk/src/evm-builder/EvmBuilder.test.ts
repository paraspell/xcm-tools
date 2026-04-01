import type { PolkadotApi } from '@paraspell/sdk-core'
import {
  type TCurrencyInputWithAmount,
  transferMoonbeamEvm,
  transferMoonbeamToEth,
  validateAddress
} from '@paraspell/sdk-core'
import type { WalletClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EvmBuilder } from './EvmBuilder'

vi.mock('@paraspell/sdk-core')

const mockApi = {
  init: vi.fn(),
  deserializeExtrinsics: vi.fn()
} as unknown as PolkadotApi<unknown, unknown, unknown>

describe('EvmBuilderClass', () => {
  let signer: WalletClient
  let currency: TCurrencyInputWithAmount
  let address: string

  beforeEach(() => {
    vi.resetAllMocks()
    signer = {} as WalletClient
    currency = {} as TCurrencyInputWithAmount
    address = '0x1234567890abcdef'
  })

  it('should call transferMoonbeamToEth if from is Moonbeam and to is Ethereum', async () => {
    const builder = EvmBuilder(mockApi)
      .from('Moonbeam')
      .to('Ethereum')
      .currency(currency)
      .recipient(address)
      .ahAddress(address)
      .signer(signer)

    await builder.build()

    expect(validateAddress).toHaveBeenCalledWith(mockApi, address, 'Ethereum')
    expect(transferMoonbeamToEth).toHaveBeenCalledWith('Moonbeam', {
      api: mockApi,
      from: 'Moonbeam',
      to: 'Ethereum',
      currency,
      recipient: address,
      ahAddress: address,
      signer
    })
  })

  it('should call transferMoonbeamEvm if from is not Moonbeam and to is not Ethereum', async () => {
    const builder = EvmBuilder(mockApi)
      .from('Darwinia')
      .to('AssetHubPolkadot')
      .currency(currency)
      .recipient(address)
      .ahAddress(address)
      .signer(signer)

    await builder.build()

    expect(validateAddress).toHaveBeenCalledWith(mockApi, address, 'AssetHubPolkadot')
    expect(transferMoonbeamEvm).toHaveBeenCalledWith({
      api: mockApi,
      from: 'Darwinia',
      to: 'AssetHubPolkadot',
      currency,
      recipient: address,
      ahAddress: address,
      signer
    })
  })
})
