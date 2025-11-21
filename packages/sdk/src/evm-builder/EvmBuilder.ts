import type {
  IPolkadotApi,
  TChain,
  TCurrencyInputWithAmount,
  TEvmBuilderOptions
} from '@paraspell/sdk-core'
import { transferMoonbeamEvm, transferMoonbeamToEth, validateAddress } from '@paraspell/sdk-core'
import type { WalletClient } from 'viem'

import type { TEvmChainFromPapi } from '../types'

/**
 * Builder class for constructing transfers from Ethereum to Polkadot.
 */
export class EvmBuilderCore<
  TApi,
  TRes,
  T extends Partial<TEvmBuilderOptions<TApi, TRes>> = object
> {
  protected readonly _options: T

  constructor(options: T) {
    this._options = options
  }

  from(chain: TEvmChainFromPapi): EvmBuilderCore<TApi, TRes, T & { from: TEvmChainFromPapi }> {
    return new EvmBuilderCore({ ...this._options, from: chain })
  }

  /**
   * Specifies the destination chain on Polkadot.
   *
   * @param chain - The Polkadot chain to which the transfer will be made.
   * @returns An instance of EvmBuilder
   */
  to(chain: TChain): EvmBuilderCore<TApi, TRes, T & { to: TChain }> {
    return new EvmBuilderCore({ ...this._options, to: chain })
  }

  /**
   * Specifies the currency to transfer.
   *
   * @param currency - The currency to be transferred.
   * @returns An instance of EvmBuilder
   */
  currency(
    currency: TCurrencyInputWithAmount
  ): EvmBuilderCore<TApi, TRes, T & { currency: TCurrencyInputWithAmount }> {
    return new EvmBuilderCore({ ...this._options, currency })
  }

  /**
   * Specifies the recipient address on Polkadot.
   *
   * @param address - The Polkadot address to receive the transfer.
   * @returns An instance of EvmBuilder
   */
  address(address: string): EvmBuilderCore<TApi, TRes, T & { address: string }> {
    return new EvmBuilderCore({ ...this._options, address })
  }

  /**
   * Sets the asset hub address. This is used for transfers that go through the Asset Hub.
   *
   * @param address - The address to be used.
   * @returns An instance of EvmBuilder
   */
  ahAddress(address: string | undefined) {
    return new EvmBuilderCore({ ...this._options, ahAddress: address })
  }

  /**
   * Specifies the signer for the Ethereum transaction.
   *
   * @param signer - The Ethereum signer to authorize the transfer.
   * @returns An instance of EvmBuilder
   */
  signer(signer: WalletClient): EvmBuilderCore<TApi, TRes, T & { signer: WalletClient }> {
    return new EvmBuilderCore({ ...this._options, signer })
  }

  /**
   * Builds and executes the transfer from Ethereum to Polkadot.
   *
   * @throws Error if any required parameters are missing.
   */
  async build(this: EvmBuilderCore<TApi, TRes, TEvmBuilderOptions<TApi, TRes>>): Promise<string> {
    const { from, to, address, api } = this._options
    validateAddress(api, address, to)

    if (from === 'Moonbeam' && to === 'Ethereum') {
      return transferMoonbeamToEth(this._options)
    }

    return transferMoonbeamEvm(this._options)
  }
}

/**
 * Creates a new EvmBuilder instance for constructing Ethereum to Polkadot transfers.
 *
 * @param provider - The Ethereum provider to use for the transfer.
 * @returns An instance of EvmBuilder class
 */
export const EvmBuilder = <TApi, TRes>(api: IPolkadotApi<TApi, TRes>) => new EvmBuilderCore({ api })
