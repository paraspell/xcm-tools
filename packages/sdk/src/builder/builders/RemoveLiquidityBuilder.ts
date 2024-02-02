// Implements builder pattern for RemoveLiquidity operation used in XYK Pallet

import { type ApiPromise } from '@polkadot/api'
import { type Extrinsic } from '../../types'
import { removeLiquidity } from '../../pallets/xyk'

export interface FinalRemoveLiquidityBuilder {
  build: () => Extrinsic
}

export interface LiquidityAmountRemoveLiquidityBuilder {
  liquidityAmount: (liquidityAmount: number) => FinalRemoveLiquidityBuilder
}

export interface AssetBRemoveLiquidityBuilder {
  assetB: (assetB: number) => LiquidityAmountRemoveLiquidityBuilder
}

export interface AssetARemoveLiquidityBuilder {
  assetA: (assetA: number) => AssetBRemoveLiquidityBuilder
}

class RemoveLiquidityBuilder
  implements
    AssetARemoveLiquidityBuilder,
    AssetBRemoveLiquidityBuilder,
    LiquidityAmountRemoveLiquidityBuilder,
    FinalRemoveLiquidityBuilder
{
  private readonly api: ApiPromise

  private _assetA: number
  private _assetB: number
  private _liquidityAmount: any

  private constructor(api: ApiPromise) {
    this.api = api
  }

  static create(api: ApiPromise): AssetARemoveLiquidityBuilder {
    return new RemoveLiquidityBuilder(api)
  }

  assetA(assetA: number): this {
    this._assetA = assetA
    return this
  }

  assetB(assetB: number): this {
    this._assetB = assetB
    return this
  }

  liquidityAmount(liquidityAmount: any): this {
    this._liquidityAmount = liquidityAmount
    return this
  }

  build(): Extrinsic {
    return removeLiquidity(this.api, this._assetA, this._assetB, this._liquidityAmount)
  }
}

export default RemoveLiquidityBuilder
