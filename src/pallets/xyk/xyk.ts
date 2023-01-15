import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, Bool } from '../../types'

export function addLiquidity(
  api: ApiPromise,
  assetA: number,
  assetB: number,
  amountA: any,
  amountBMaxLimit: any
): Extrinsic {
  return api.tx.xyk.addLiquidity(
    assetA,
    assetB,
    amountA,
    amountBMaxLimit
  )
}

export function buy(
  api: ApiPromise,
  assetOut: number,
  assetIn: number,
  amount: any,
  maxLimit: any,
  discount: Bool
): Extrinsic {
  return api.tx.xyk.buy(
    assetOut,
    assetIn,
    amount,
    maxLimit,
    discount
  )
}

export function createPool(
  api: ApiPromise,
  assetA: number,
  amountA: any,
  assetB: number,
  amountB: any
): Extrinsic {
  return api.tx.xyk.createPool(
    assetA,
    amountA,
    assetB,
    amountB
  )
}

export function removeLiquidity(
  api: ApiPromise,
  assetA: number,
  assetB: number,
  liquidityAmount: any
): Extrinsic {
  return api.tx.xyk.removeLiquidity(
    assetA,
    assetB,
    liquidityAmount
  )
}

export function sell(
  api: ApiPromise,
  assetIn: number,
  assetOut: number,
  amount: any,
  maxLimit: any,
  discount: Bool
): Extrinsic {
  return api.tx.xyk.sell(
    assetIn,
    assetOut,
    amount,
    maxLimit,
    discount
  )
}
