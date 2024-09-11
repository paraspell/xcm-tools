import { AbstractProvider, Signer } from 'ethers'
import { TCurrencyCore, TNodePolkadotKusama } from '../../../types'
import { TEvmBuilderOptions, TOptionalEvmBuilderOptions } from '../../../types/TBuilder'
import transferEthToPolkadot from '../../../pallets/xcmPallet/ethTransfer/ethTransfer'

class EvmBuilderClass {
  private readonly _options: TOptionalEvmBuilderOptions

  private readonly _provider: AbstractProvider

  constructor(provider: AbstractProvider) {
    this._provider = provider
    this._options = {}
  }

  to(node: TNodePolkadotKusama): this {
    this._options.to = node
    return this
  }

  amount(amount: string): this {
    this._options.amount = amount
    return this
  }

  currency(currency: TCurrencyCore): this {
    this._options.currency = currency
    return this
  }

  address(address: string): this {
    this._options.address = address
    return this
  }

  signer(signer: Signer): this {
    this._options.signer = signer
    return this
  }

  async build(): Promise<void> {
    const requiredParams: Array<keyof TEvmBuilderOptions> = [
      'to',
      'amount',
      'currency',
      'address',
      'signer'
    ]

    for (const param of requiredParams) {
      if (this._options[param] === undefined) {
        throw new Error(`Builder object is missing parameter: ${param}`)
      }
    }

    await transferEthToPolkadot(this._provider, this._options as TEvmBuilderOptions)
  }
}

export const EvmBuilder = (provider: AbstractProvider) => new EvmBuilderClass(provider)
