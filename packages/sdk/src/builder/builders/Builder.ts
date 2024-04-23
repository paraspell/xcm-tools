// Implements general builder pattern, this is Builder main file

import { type ApiPromise } from '@polkadot/api'
import {
  type TAmount,
  type Extrinsic,
  type TNode,
  type TSerializedApiCall,
  type TCurrencyInput,
  type TDestination,
  type TAddress,
  type TCurrency
} from '../../types'
import CloseChannelBuilder, { type InboundCloseChannelBuilder } from './CloseChannelBuilder'
import OpenChannelBuilder, { type MaxSizeOpenChannelBuilder } from './OpenChannelBuilder'
import RelayToParaBuilder from './RelayToParaBuilder'
import ParaToParaBuilder from './ParaToParaBuilder'
import ParaToRelayBuilder from './ParaToRelayBuilder'
import { MissingApiPromiseError } from '../../errors/MissingApiPromiseError'

class ToGeneralBuilder {
  private readonly api?: ApiPromise
  private readonly from: TNode
  private readonly to: TDestination
  private readonly paraIdTo?: number

  constructor(api: ApiPromise | undefined, from: TNode, to: TDestination, paraIdTo?: number) {
    this.api = api
    this.from = from
    this.to = to
    this.paraIdTo = paraIdTo
  }

  currency(currency: TCurrencyInput): AmountOrFeeAssetBuilder {
    return ParaToParaBuilder.createParaToPara(this.api, this.from, this.to, currency, this.paraIdTo)
  }

  openChannel(): MaxSizeOpenChannelBuilder {
    if (this.api === undefined) {
      throw new MissingApiPromiseError()
    }
    return OpenChannelBuilder.create(this.api, this.from, this.to)
  }
}

class FromGeneralBuilder {
  private readonly api?: ApiPromise
  private readonly from: TNode

  private _feeAsset?: TCurrency

  constructor(api: ApiPromise | undefined, from: TNode) {
    this.api = api
    this.from = from
  }

  to(node: TDestination, paraIdTo?: number): ToGeneralBuilder {
    return new ToGeneralBuilder(this.api, this.from, node, paraIdTo)
  }

  feeAsset(feeAsset: TCurrency): AmountBuilder {
    this._feeAsset = feeAsset
    return this
  }

  amount(amount: TAmount): AddressBuilder {
    return ParaToRelayBuilder.create(this.api, this.from, amount, this._feeAsset)
  }

  closeChannel(): InboundCloseChannelBuilder {
    if (this.api === undefined) {
      throw new MissingApiPromiseError()
    }
    return CloseChannelBuilder.create(this.api, this.from)
  }
}

class GeneralBuilder {
  private readonly api?: ApiPromise

  constructor(api?: ApiPromise) {
    this.api = api
  }

  from(node: TNode): FromGeneralBuilder {
    return new FromGeneralBuilder(this.api, node)
  }

  to(node: TDestination, paraIdTo?: number): AmountBuilder {
    return RelayToParaBuilder.create(this.api, node, paraIdTo)
  }
}

export const Builder = (api?: ApiPromise): GeneralBuilder => {
  return new GeneralBuilder(api)
}

export interface FinalBuilder {
  build: () => Extrinsic | never
  buildSerializedApiCall: () => TSerializedApiCall
}

export interface UseKeepAliveFinalBuilder {
  useKeepAlive: (destApi: ApiPromise) => UseKeepAliveFinalBuilder
  build: () => Promise<Extrinsic | never>
  buildSerializedApiCall: () => Promise<TSerializedApiCall>
}

export interface AddressBuilder {
  address: (address: TAddress) => UseKeepAliveFinalBuilder
}

export interface AmountBuilder {
  amount: (amount: TAmount) => AddressBuilder
}

export interface AmountOrFeeAssetBuilder {
  amount: (amount: TAmount) => AddressBuilder
  feeAsset: (feeAsset: TCurrencyInput) => AmountBuilder
}

export * from './CloseChannelBuilder'
export * from './OpenChannelBuilder'
