import { ApiPromise } from '@polkadot/api'
import { Bool, Extrinsic } from '../../../types'
import { buy } from '../../xyk'

export interface FinalBuyBuilder {
    build(): Extrinsic
}

export interface DiscountBuyBuilder {
    discount(discount: Bool): FinalBuyBuilder
}

export interface MaxLimitBuyBuilder {
    maxLimit(maxLimit: number): DiscountBuyBuilder
}

export interface AmountBuyBuilder {
    amount(amount: number): MaxLimitBuyBuilder
}

export interface AssetInBuyBuilder {
    assetIn(assetIn: number): AmountBuyBuilder
}

export interface AssetOutBuyBuilder {
    assetOut(assetOut: number): AssetInBuyBuilder
}

class BuyBuilder implements AssetOutBuyBuilder, AssetInBuyBuilder, AmountBuyBuilder, MaxLimitBuyBuilder, FinalBuyBuilder {
  private api: ApiPromise

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

  assetOut(assetOut: number) {
    this._assetOut = assetOut
    return this
  }

  assetIn(assetIn: number) {
    this._assetIn = assetIn
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
    return buy(this.api, this._assetOut, this._assetIn, this._amount, this._maxLimit, this._discount)
  }
}

export default BuyBuilder
