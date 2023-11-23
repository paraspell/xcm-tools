// Implements builder pattern for Sell operation used in XYK Pallet

import { type ApiPromise } from '@polkadot/api'
import { type Bool, type Extrinsic } from '../../../types'
import { sell } from '../../xyk'

export interface FinalSellBuilder {
  build: () => Extrinsic
}

export interface DiscountSellBuilder {
  discount: (discount: Bool) => FinalSellBuilder
}

export interface MaxLimitSellBuilder {
  maxLimit: (maxLimit: number) => DiscountSellBuilder
}

export interface AmountSellBuilder {
  amount: (amount: number) => MaxLimitSellBuilder
}

export interface AssetOutSellBuilder {
  assetOut: (assetOut: number) => AmountSellBuilder
}

export interface AssetInSellBuilder {
  assetIn: (assetIn: number) => AssetOutSellBuilder
}

class SellBuilder
  implements
    AssetInSellBuilder,
    AssetOutSellBuilder,
    AmountSellBuilder,
    MaxLimitSellBuilder,
    FinalSellBuilder
{
  private readonly api: ApiPromise

  private _assetIn: number
  private _assetOut: number
  private _amount: any
  private _maxLimit: any
  private _discount: Bool

  private constructor(api: ApiPromise) {
    this.api = api
  }

  static create(api: ApiPromise): AssetInSellBuilder {
    return new SellBuilder(api)
  }

  assetIn(assetIn: number): this {
    this._assetIn = assetIn
    return this
  }

  assetOut(assetOut: number): this {
    this._assetOut = assetOut
    return this
  }

  amount(amount: any): this {
    this._amount = amount
    return this
  }

  maxLimit(maxLimit: any): this {
    this._maxLimit = maxLimit
    return this
  }

  discount(discount: Bool): this {
    this._discount = discount
    return this
  }

  build(): Extrinsic {
    return sell(
      this.api,
      this._assetIn,
      this._assetOut,
      this._amount,
      this._maxLimit,
      this._discount
    )
  }
}

export default SellBuilder
