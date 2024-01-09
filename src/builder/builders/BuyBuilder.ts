// Implements builder pattern for Buy operation used in XYK Pallet

import { type ApiPromise } from '@polkadot/api'
import { type Bool, type Extrinsic } from '../../types'
import { buy } from '../../pallets/xyk'

export interface FinalBuyBuilder {
  build: () => Extrinsic
}

export interface DiscountBuyBuilder {
  discount: (discount: Bool) => FinalBuyBuilder
}

export interface MaxLimitBuyBuilder {
  maxLimit: (maxLimit: number) => DiscountBuyBuilder
}

export interface AmountBuyBuilder {
  amount: (amount: number) => MaxLimitBuyBuilder
}

export interface AssetInBuyBuilder {
  assetIn: (assetIn: number) => AmountBuyBuilder
}

export interface AssetOutBuyBuilder {
  assetOut: (assetOut: number) => AssetInBuyBuilder
}

class BuyBuilder
  implements
    AssetOutBuyBuilder,
    AssetInBuyBuilder,
    AmountBuyBuilder,
    MaxLimitBuyBuilder,
    FinalBuyBuilder
{
  private readonly api: ApiPromise

  private _assetOut: number
  private _assetIn: number
  private _amount: any
  private _maxLimit: any
  private _discount: Bool

  private constructor(api: ApiPromise) {
    this.api = api
  }

  static create(api: ApiPromise): AssetOutBuyBuilder {
    return new BuyBuilder(api)
  }

  assetOut(assetOut: number): this {
    this._assetOut = assetOut
    return this
  }

  assetIn(assetIn: number): this {
    this._assetIn = assetIn
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
    return buy(
      this.api,
      this._assetOut,
      this._assetIn,
      this._amount,
      this._maxLimit,
      this._discount
    )
  }
}

export default BuyBuilder
