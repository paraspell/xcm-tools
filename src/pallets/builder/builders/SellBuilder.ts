//Implements builder pattern for Sell operation used in XYK Pallet

import { ApiPromise } from '@polkadot/api'
import { Bool, Extrinsic } from '../../../types'
import { sell } from '../../xyk'

export interface FinalSellBuilder {
  build(): Extrinsic
}

export interface DiscountSellBuilder {
  discount(discount: Bool): FinalSellBuilder
}

export interface MaxLimitSellBuilder {
  maxLimit(maxLimit: number): DiscountSellBuilder
}

export interface AmountSellBuilder {
  amount(amount: number): MaxLimitSellBuilder
}

export interface AssetOutSellBuilder {
  assetOut(assetOut: number): AmountSellBuilder
}

export interface AssetInSellBuilder {
  assetIn(assetIn: number): AssetOutSellBuilder
}

class SellBuilder
  implements
    AssetInSellBuilder,
    AssetOutSellBuilder,
    AmountSellBuilder,
    MaxLimitSellBuilder,
    FinalSellBuilder
{
  private api: ApiPromise

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

  assetIn(assetIn: number) {
    this._assetIn = assetIn
    return this
  }

  assetOut(assetOut: number) {
    this._assetOut = assetOut
    return this
  }

  amount(amount: any) {
    this._amount = amount
    return this
  }

  maxLimit(maxLimit: any) {
    this._maxLimit = maxLimit
    return this
  }

  discount(discount: Bool) {
    this._discount = discount
    return this
  }

  build() {
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
