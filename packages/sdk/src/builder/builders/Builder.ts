// Implements general builder pattern, this is Builder main file

import { type ApiPromise } from '@polkadot/api'
import type {
  TAmount,
  Extrinsic,
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
  TBatchOptions
} from '../../types'
import RelayToParaBuilder from './RelayToParaBuilder'
import ParaToParaBuilder from './ParaToParaBuilder'
import ParaToRelayBuilder from './ParaToRelayBuilder'
import AssetClaimBuilder from './AssetClaimBuilder'
import BatchTransactionManager from './BatchTransactionManager'
import type { IAddToBatchBuilder } from './IBatchBuilder'

/**
 * A builder class for constructing a Para-to-Para and Para-to-Relay transactions.
 */
class ToGeneralBuilder {
  private readonly api?: ApiPromise
  private readonly from: TNode
  private readonly to: TDestination
  private readonly paraIdTo?: number

  constructor(
    api: ApiPromise | undefined,
    from: TNode,
    to: TDestination,
    private batchManager: BatchTransactionManager,
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
  currency(currency: TCurrencyInput): AmountOrFeeAssetBuilder {
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
class FromGeneralBuilder {
  private readonly api?: ApiPromise
  private readonly from: TNode

  private _feeAsset?: TCurrency

  constructor(
    api: ApiPromise | undefined,
    from: TNode,
    private batchManager: BatchTransactionManager
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
  to(node: TDestination, paraIdTo?: number): ToGeneralBuilder {
    return new ToGeneralBuilder(this.api, this.from, node, this.batchManager, paraIdTo)
  }

  /**
   * Specifies the fee asset to be used for the transaction.
   *
   * @param feeAsset - The currency to be used as the fee asset.
   * @returns An instance of Builder
   */
  feeAsset(feeAsset: TCurrency): AmountBuilder {
    this._feeAsset = feeAsset
    return this
  }

  /**
   * Specifies the amount for the transaction.
   *
   * @param amount - The amount to be transferred.
   * @returns An instance of Builder
   */
  amount(amount: TAmount | null): AddressBuilder {
    return ParaToRelayBuilder.create(this.api, this.from, amount, this.batchManager, this._feeAsset)
  }
}

/**
 * A builder class for constructing Para-to-Para, Para-to-Relay, Relay-to-Para transactions and asset claims.
 */
export class GeneralBuilder {
  constructor(
    private readonly batchManager: BatchTransactionManager,
    private readonly api?: ApiPromise,
    private readonly _from?: TNode,
    private readonly _to?: TDestination
  ) {}

  /**
   * Specifies the origin node for the transaction.
   *
   * @param node - The node from which the transaction originates.
   * @returns An instance of Builder
   */
  from(node: TNode): FromGeneralBuilder {
    return new FromGeneralBuilder(this.api, node, this.batchManager)
  }

  /**
   * Specifies the destination node for the transaction.
   *
   * @param node - The node to which the transaction is sent.
   * @param paraIdTo - (Optional) The parachain ID of the destination node.
   * @returns An instance of Builder
   */
  to(node: TDestination, paraIdTo?: number): AmountBuilder {
    return RelayToParaBuilder.create(this.api, node, this.batchManager, paraIdTo)
  }

  /**
   * Initiates the process to claim assets from a specified node.
   *
   * @param node - The node from which to claim assets.
   * @returns An instance of Builder
   */
  claimFrom(node: TNodeWithRelayChains): FungibleBuilder {
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
export const Builder = (api?: ApiPromise): GeneralBuilder => {
  return new GeneralBuilder(new BatchTransactionManager(), api)
}

export interface FinalBuilder {
  build: () => Extrinsic | never
  buildSerializedApiCall: () => TSerializedApiCall
}

export interface FinalBuilderAsync {
  build: () => Promise<Extrinsic>
  buildSerializedApiCall: () => Promise<TSerializedApiCall>
}

export interface UseKeepAliveFinalBuilder extends IAddToBatchBuilder {
  useKeepAlive: (destApi: ApiPromise) => this
  xcmVersion: (version: Version) => this
  build: () => Promise<Extrinsic>
  buildSerializedApiCall: () => Promise<TSerializedApiCall>
}

export interface AddressBuilder {
  address: (address: TAddress) => UseKeepAliveFinalBuilder
}

export interface AmountBuilder {
  amount: (amount: TAmount | null) => AddressBuilder
}

export interface AmountOrFeeAssetBuilder {
  amount: (amount: TAmount | null) => AddressBuilder
  feeAsset: (feeAsset: TCurrency) => AmountBuilder
}

export interface FungibleBuilder {
  fungible: (multiAssets: TMultiAsset[]) => AccountBuilder
}

export interface AccountBuilder {
  account: (address: TAddress) => VersionBuilder
}

export interface VersionBuilder extends FinalBuilderAsync {
  xcmVersion: (version: TVersionClaimAssets) => FinalBuilderAsync
}
