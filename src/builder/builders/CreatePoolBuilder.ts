// Implements builder pattern for CreatePool operation used in XYK Pallet

import { type ApiPromise } from '@polkadot/api'
import { type Extrinsic } from '../../types'
import { createPool } from '../../pallets/xyk'

export interface FinalCreatePoolBuilder {
  build: () => Extrinsic
}

export interface AmountBCreatePoolBuilder {
  amountB: (amountB: number) => FinalCreatePoolBuilder
}

export interface AssetBCreatePoolBuilder {
  assetB: (assetB: number) => AmountBCreatePoolBuilder
}

export interface AmountACreatePoolBuilder {
  amountA: (amountA: number) => AssetBCreatePoolBuilder
}

export interface AssetACreatePoolBuilder {
  assetA: (assetA: number) => AmountACreatePoolBuilder
}

class CreatePoolBuilder
  implements
    AssetACreatePoolBuilder,
    AmountACreatePoolBuilder,
    AssetBCreatePoolBuilder,
    AmountBCreatePoolBuilder,
    FinalCreatePoolBuilder
{
  private readonly api: ApiPromise

  private _assetA: number
  private _amountA: any
  private _assetB: number
  private _amountB: any

  private constructor(api: ApiPromise) {
    this.api = api
  }

  static create(api: ApiPromise): AssetACreatePoolBuilder {
    return new CreatePoolBuilder(api)
  }

  assetA(assetA: number): this {
    this._assetA = assetA
    return this
  }

  amountA(amountA: any): this {
    this._amountA = amountA
    return this
  }

  assetB(assetB: number): this {
    this._assetB = assetB
    return this
  }

  amountB(amountB: any): this {
    this._amountB = amountB
    return this
  }

  build(): Extrinsic {
    return createPool(this.api, this._assetA, this._amountA, this._assetB, this._amountB)
  }
}

export default CreatePoolBuilder
