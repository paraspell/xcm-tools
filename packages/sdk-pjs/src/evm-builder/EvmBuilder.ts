import type {
  IPolkadotApi,
  TCurrencyInputWithAmount,
  TNodeWithRelayChains
} from '@paraspell/sdk-core'
import {
  InvalidParameterError,
  transferMoonbeamEvm,
  transferMoonbeamToEth
} from '@paraspell/sdk-core'
import { validateAddress } from '@paraspell/sdk-core'
import type { TEvmNodeFrom } from '@paraspell/sdk-core/src'
import type { AbstractProvider, Signer } from 'ethers'
import type { WalletClient } from 'viem'

import { transferEthToPolkadot } from '../ethTransfer'
import type { TPjsEvmBuilderOptions } from '../types'
import { isEthersSigner } from '../utils'

/**
 * Builder class for constructing transfers from Ethereum to Polkadot.
 */
export class EvmBuilderCore<
  TApi,
  TRes,
  T extends Partial<TPjsEvmBuilderOptions<TApi, TRes>> = object
> {
  protected readonly _options: T

  constructor(options: T) {
    this._options = options
  }

  from(node: TEvmNodeFrom): EvmBuilderCore<TApi, TRes, T & { from: TEvmNodeFrom }> {
    return new EvmBuilderCore({ ...this._options, from: node })
  }

  /**
   * Specifies the destination node on Polkadot.
   *
   * @param node - The Polkadot node to which the transfer will be made.
   * @returns An instance of EvmBuilder
   */
  to(node: TNodeWithRelayChains): EvmBuilderCore<TApi, TRes, T & { to: TNodeWithRelayChains }> {
    return new EvmBuilderCore({ ...this._options, to: node })
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
  signer(
    signer: Signer | WalletClient
  ): EvmBuilderCore<TApi, TRes, T & { signer: Signer | WalletClient }> {
    return new EvmBuilderCore({ ...this._options, signer })
  }

  /**
   * Builds and executes the transfer from Ethereum to Polkadot.
   *
   * @throws Error if any required parameters are missing.
   */
  async build(
    this: EvmBuilderCore<TApi, TRes, TPjsEvmBuilderOptions<TApi, TRes>>
  ): Promise<string> {
    const { from, to, address, signer } = this._options
    validateAddress(address, to)

    if (from === 'Moonbeam' && to === 'Ethereum') {
      if (isEthersSigner(signer)) {
        throw new InvalidParameterError(
          'Ethers signer is not supported for Moonbeam to Ethereum transfers.'
        )
      }

      return transferMoonbeamToEth({ ...this._options, signer: signer })
    }

    if (from === 'Moonbeam' || from === 'Moonriver' || from === 'Darwinia') {
      if (isEthersSigner(signer)) {
        throw new InvalidParameterError(
          'Ethers signer is not supported for Moonbeam to Ethereum transfers.'
        )
      }
      return transferMoonbeamEvm({ ...this._options, signer: signer })
    } else {
      const { response } = await transferEthToPolkadot(this._options)
      return response.hash
    }
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
) => new EvmBuilderCore({ api, provider })
