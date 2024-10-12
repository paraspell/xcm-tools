import type { AbstractProvider, Signer } from 'ethers'
import type { TCurrencyCore, TNodePolkadotKusama } from '../../../types'
import type { TEvmBuilderOptions, TOptionalEvmBuilderOptions } from '../../../types/TBuilder'
import transferEthToPolkadot from '../../../pallets/xcmPallet/ethTransfer/ethTransfer'

/**
 * Builder class for constructing transfers from Ethereum to Polkadot.
 */
class EvmBuilderClass {
  private readonly _options: TOptionalEvmBuilderOptions

  private readonly _provider: AbstractProvider

  constructor(provider: AbstractProvider) {
    this._provider = provider
    this._options = {}
  }

  /**
   * Specifies the destination node on Polkadot.
   *
   * @param node - The Polkadot node to which the transfer will be made.
   * @returns An instance of EvmBuilder
   */
  to(node: TNodePolkadotKusama): this {
    this._options.to = node
    return this
  }

  /**
   * Specifies the amount to transfer.
   *
   * @param amount - The amount to transfer, as a string.
   * @returns An instance of EvmBuilder
   */
  amount(amount: string): this {
    this._options.amount = amount
    return this
  }

  /**
   * Specifies the currency to transfer.
   *
   * @param currency - The currency to be transferred.
   * @returns An instance of EvmBuilder
   */
  currency(currency: TCurrencyCore): this {
    this._options.currency = currency
    return this
  }

  /**
   * Specifies the recipient address on Polkadot.
   *
   * @param address - The Polkadot address to receive the transfer.
   * @returns An instance of EvmBuilder
   */
  address(address: string): this {
    this._options.address = address
    return this
  }

  /**
   * Specifies the signer for the Ethereum transaction.
   *
   * @param signer - The Ethereum signer to authorize the transfer.
   * @returns An instance of EvmBuilder
   */
  signer(signer: Signer): this {
    this._options.signer = signer
    return this
  }

  /**
   * Builds and executes the transfer from Ethereum to Polkadot.
   *
   * @throws Error if any required parameters are missing.
   */
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

/**
 * Creates a new EvmBuilder instance for constructing Ethereum to Polkadot transfers.
 *
 * @param provider - The Ethereum provider to use for the transfer.
 * @returns An instance of EvmBuilder class
 */
export const EvmBuilder = (provider: AbstractProvider) => new EvmBuilderClass(provider)
