// Contains XYK Decentralized exchange functions implemented in collaboration with Basilisk team

import type { ApiPromise } from '@polkadot/api'
import { type Extrinsic, type Bool } from '../../types'

export const addLiquidity = (
  api: ApiPromise,
  assetA: number,
  assetB: number,
  amountA: any,
  amountBMaxLimit: any
): Extrinsic => api.tx.xyk.addLiquidity(assetA, assetB, amountA, amountBMaxLimit)

export const buy = (
  api: ApiPromise,
  assetOut: number,
  assetIn: number,
  amount: any,
  maxLimit: any,
  discount: Bool
): Extrinsic => api.tx.xyk.buy(assetOut, assetIn, amount, maxLimit, discount)

export const createPool = (
  api: ApiPromise,
  assetA: number,
  amountA: any,
  assetB: number,
  amountB: any
): Extrinsic => api.tx.xyk.createPool(assetA, amountA, assetB, amountB)

export const removeLiquidity = (
  api: ApiPromise,
  assetA: number,
  assetB: number,
  liquidityAmount: any
): Extrinsic => api.tx.xyk.removeLiquidity(assetA, assetB, liquidityAmount)

export const sell = (
  api: ApiPromise,
  assetIn: number,
  assetOut: number,
  amount: any,
  maxLimit: any,
  discount: Bool
): Extrinsic => api.tx.xyk.sell(assetIn, assetOut, amount, maxLimit, discount)
