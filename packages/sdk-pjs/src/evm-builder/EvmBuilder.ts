import type {
  TOptionalEvmBuilderOptions,
  IPolkadotApi,
  TNodePolkadotKusama,
  TCurrencyCoreV1WithAmount,
  TEvmBuilderOptions
} from '@paraspell/sdk-core'
import { transferMoonbeamEvm } from '@paraspell/sdk-core'
import type { AbstractProvider, Signer } from 'ethers'
import { transferEthToPolkadot } from '../ethTransfer'
/**
 * Builder class for constructing transfers from Ethereum to Polkadot.
 */
export class EvmBuilderClass<TApi, TRes> {
  _options: TOptionalEvmBuilderOptions<TApi, TRes>

  constructor(api: IPolkadotApi<TApi, TRes>, provider?: AbstractProvider) {
    this._options = {}
    this._options.api = api
    this._options.provider = provider
  }

  from(node: 'Ethereum' | 'Moonbeam' | 'Moonriver'): this {
    this._options.from = node
    return this
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
   * Specifies the currency to transfer.
   *
   * @param currency - The currency to be transferred.
   * @returns An instance of EvmBuilder
   */
  currency(currency: TCurrencyCoreV1WithAmount): this {
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
  async build(): Promise<string> {
    const requiredParams: Array<keyof TEvmBuilderOptions<TApi, TRes>> = [
      'from',
      'to',
      'currency',
      'address',
      'signer'
    ]

    for (const param of requiredParams) {
      if (this._options[param] === undefined) {
        throw new Error(`Builder object is missing parameter: ${param}`)
      }
    }

    if (this._options.from === 'Moonbeam' || this._options.from === 'Moonriver') {
      return await transferMoonbeamEvm(this._options as TEvmBuilderOptions<TApi, TRes>)
    }

    return (
      (await transferEthToPolkadot(this._options as TEvmBuilderOptions<TApi, TRes>)).result.success
        ?.ethereum.blockHash ?? ''
    )
  }
}

/**
 * Creates a new EvmBuilder instance for constructing Ethereum to Polkadot transfers.
 *
 * @param provider - The Ethereum provider to use for the transfer.
 * @returns An instance of EvmBuilder class
 */
export const EvmBuilder = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  provider?: AbstractProvider
) => new EvmBuilderClass(api, provider)
