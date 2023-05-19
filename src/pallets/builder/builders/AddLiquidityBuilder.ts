//Implements builder pattern for AddLiquidity operation used in XYK Pallet

import { ApiPromise } from '@polkadot/api'
import { Extrinsic } from '../../../types'
import { addLiquidity } from '../../xyk'

export interface FinalAddLiquidityBuilder {
  build(): Extrinsic
}

export interface AmountBMaxLimitAddLiquidityBuilder {
  amountBMaxLimit(amountBMaxLimit: number): FinalAddLiquidityBuilder
}

export interface AmountAAddLiquidityBuilder {
  amountA(amountA: number): AmountBMaxLimitAddLiquidityBuilder
}

export interface AssetBAddLiquidityBuilder {
  assetB(assetB: number): AmountAAddLiquidityBuilder
}

export interface AssetAAddLiquidityBuilder {
  assetA(assetA: number): AssetBAddLiquidityBuilder
}

class AddLiquidityBuilder
  implements
    AssetAAddLiquidityBuilder,
    AssetBAddLiquidityBuilder,
    AmountAAddLiquidityBuilder,
    AmountBMaxLimitAddLiquidityBuilder,
    FinalAddLiquidityBuilder
{
  private api: ApiPromise

  private _assetA: number
  private _assetB: number
  private _amountA: any
  private _amountBMaxLimit: any

  private constructor(api: ApiPromise) {
    this.api = api
  }

  static create(api: ApiPromise): AssetAAddLiquidityBuilder {
    return new AddLiquidityBuilder(api)
  }

  assetA(assetA: number) {
    this._assetA = assetA
    return this
  }

  assetB(assetB: number) {
    this._assetB = assetB
    return this
  }

  amountA(amountA: any) {
    this._amountA = amountA
    return this
  }

  amountBMaxLimit(amountBMaxLimit: any) {
    this._amountBMaxLimit = amountBMaxLimit
    return this
  }

  build() {
    return addLiquidity(this.api, this._assetA, this._assetB, this._amountA, this._amountBMaxLimit)
  }
}

export default AddLiquidityBuilder
