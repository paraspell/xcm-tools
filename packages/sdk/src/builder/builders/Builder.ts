// Implements general builder pattern, this is Builder main file

import type {
  TAmount,
  TNode,
  TSerializedApiCall,
  TCurrencyInput,
  TDestination,
  TAddress,
  TCurrency,
  TMultiAsset,
  TNodeWithRelayChains,
  TVersionClaimAssets,
  Version,
  TBatchOptions,
  TNodePolkadotKusama
} from '../../types'
import RelayToParaBuilder from './RelayToParaBuilder'
import ParaToParaBuilder from './ParaToParaBuilder'
import ParaToRelayBuilder from './ParaToRelayBuilder'
import AssetClaimBuilder from './AssetClaimBuilder'
import BatchTransactionManager from './BatchTransactionManager'
import type { IAddToBatchBuilder } from './IBatchBuilder'
import type { IPolkadotApi } from '../../api/IPolkadotApi'

/**
 * A builder class for constructing a Para-to-Para and Para-to-Relay transactions.
 */
class ToGeneralBuilder<TApi, TRes> {
  private readonly api: IPolkadotApi<TApi, TRes>
  private readonly from: TNodePolkadotKusama
  private readonly to: TDestination
  private readonly paraIdTo?: number

  constructor(
    api: IPolkadotApi<TApi, TRes>,
    from: TNodePolkadotKusama,
    to: TDestination,
    private batchManager: BatchTransactionManager<TApi, TRes>,
    paraIdTo?: number
  ) {
    this.api = api
    this.from = from
    this.to = to
    this.paraIdTo = paraIdTo
  }

  /**
   * Specifies the currency to be used in the transaction. Symbol, ID, multi-location or multi-asset.
   *
   * @param currency - The currency to be transferred.
   * @returns An instance of Builder
   */
  currency(currency: TCurrencyInput): AmountOrFeeAssetBuilder<TApi, TRes> {
    return ParaToParaBuilder.createParaToPara(
      this.api,
      this.from,
      this.to,
      currency,
      this.batchManager,
      this.paraIdTo
    )
  }
}

/**
 * A builder class for constructing a Para-to-Para and Para-to-Relay transactions.
 */
class FromGeneralBuilder<TApi, TRes> {
  private readonly api: IPolkadotApi<TApi, TRes>
  private readonly from: TNodePolkadotKusama

  private _feeAsset?: TCurrency

  constructor(
    api: IPolkadotApi<TApi, TRes>,
    from: TNodePolkadotKusama,
    private batchManager: BatchTransactionManager<TApi, TRes>
  ) {
    this.api = api
    this.from = from
  }

  /**
   * Specifies the destination node for the transaction.
   *
   * @param node - The destination node.
   * @param paraIdTo - Optional parachain ID of the destination node.
   * @returns An instance of Builder
   */
  to(node: TDestination, paraIdTo?: number): ToGeneralBuilder<TApi, TRes> {
    return new ToGeneralBuilder(this.api, this.from, node, this.batchManager, paraIdTo)
  }

  /**
   * Specifies the fee asset to be used for the transaction.
   *
   * @param feeAsset - The currency to be used as the fee asset.
   * @returns An instance of Builder
   */
  feeAsset(feeAsset: TCurrency): AmountBuilder<TApi, TRes> {
    this._feeAsset = feeAsset
    return this
  }

  /**
   * Specifies the amount for the transaction.
   *
   * @param amount - The amount to be transferred.
   * @returns An instance of Builder
   */
  amount(amount: TAmount | null): AddressBuilder<TApi, TRes> {
    return ParaToRelayBuilder.create(this.api, this.from, amount, this.batchManager, this._feeAsset)
  }
}

/**
 * A builder class for constructing Para-to-Para, Para-to-Relay, Relay-to-Para transactions and asset claims.
 */
export class GeneralBuilder<TApi, TRes> {
  constructor(
    private readonly batchManager: BatchTransactionManager<TApi, TRes>,
    private readonly api: IPolkadotApi<TApi, TRes>,
    private readonly _from?: TNode,
    private readonly _to?: TDestination
  ) {}

  /**
   * Specifies the origin node for the transaction.
   *
   * @param node - The node from which the transaction originates.
   * @returns An instance of Builder
   */
  from(node: TNodePolkadotKusama): FromGeneralBuilder<TApi, TRes> {
    return new FromGeneralBuilder(this.api, node, this.batchManager)
  }

  /**
   * Specifies the destination node for the transaction.
   *
   * @param node - The node to which the transaction is sent.
   * @param paraIdTo - (Optional) The parachain ID of the destination node.
   * @returns An instance of Builder
   */
  to(node: TDestination, paraIdTo?: number): AmountBuilder<TApi, TRes> {
    if (node === 'Ethereum') {
      throw new Error('Transfers from Relay chain to Ethereum are not yet supported.')
    }
    return RelayToParaBuilder.create(this.api, node, this.batchManager, paraIdTo)
  }

  /**
   * Initiates the process to claim assets from a specified node.
   *
   * @param node - The node from which to claim assets.
   * @returns An instance of Builder
   */
  claimFrom(node: TNodeWithRelayChains): FungibleBuilder<TRes> {
    return AssetClaimBuilder.create(this.api, node)
  }

  /**
   * Builds and returns the batched transaction based on the configured parameters.
   *
   * @param options - (Optional) Options to customize the batch transaction.
   * @returns A Extrinsic representing the batched transactions.
   */
  async buildBatch(options?: TBatchOptions) {
    return this.batchManager.buildBatch(this.api, this._from, this._to, options)
  }
}

/**
 * Creates a new Builder instance.
 *
 * @param api - The API instance to use for building transactions. If not provided, a new instance will be created.
 * @returns A new Builder instance.
 */
export const Builder = <TApi, TRes>(api: IPolkadotApi<TApi, TRes>): GeneralBuilder<TApi, TRes> => {
  return new GeneralBuilder(new BatchTransactionManager(), api)
}

export interface FinalBuilder<TRes> {
  build: () => Promise<TRes>
  buildSerializedApiCall: () => Promise<TSerializedApiCall>
}

export interface UseKeepAliveFinalBuilder<TApi, TRes> extends IAddToBatchBuilder<TApi, TRes> {
  useKeepAlive: (destApi: TApi) => this
  xcmVersion: (version: Version) => this
  build: () => Promise<TRes>
  buildSerializedApiCall: () => Promise<TSerializedApiCall>
}

export interface AddressBuilder<TApi, TRes> {
  address: (address: TAddress, ahAddress?: string) => UseKeepAliveFinalBuilder<TApi, TRes>
}

export interface AmountBuilder<TApi, TRes> {
  amount: (amount: TAmount | null) => AddressBuilder<TApi, TRes>
}

export interface AmountOrFeeAssetBuilder<TApi, TRes> {
  amount: (amount: TAmount | null) => AddressBuilder<TApi, TRes>
  feeAsset: (feeAsset: TCurrency) => AmountBuilder<TApi, TRes>
}

export interface FungibleBuilder<TRes> {
  fungible: (multiAssets: TMultiAsset[]) => AccountBuilder<TRes>
}

export interface AccountBuilder<TRes> {
  account: (address: TAddress) => VersionBuilder<TRes>
}

export interface VersionBuilder<TRes> extends FinalBuilder<TRes> {
  xcmVersion: (version: TVersionClaimAssets) => FinalBuilder<TRes>
}
