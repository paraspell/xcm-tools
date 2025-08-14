import type { TAmount } from '@paraspell/assets'
import { parseUnits } from 'viem'

import type { IPolkadotApi } from '../../api'
import { InvalidParameterError } from '../../errors'
import { isConfig } from '..'

export const abstractDecimals = <TApi, TRes>(
  amount: TAmount,
  decimals: number | undefined,
  api: IPolkadotApi<TApi, TRes>
): bigint => {
  const config = api.getConfig()
  const abstractDecimals = isConfig(config) && config.abstractDecimals ? true : false

  return applyDecimalAbstraction(amount, decimals, abstractDecimals)
}

export const applyDecimalAbstraction = (
  amount: TAmount,
  decimals: number | undefined,
  shouldAbstract: boolean
): bigint => {
  // If amount is already bigint, return as-is
  if (typeof amount === 'bigint') {
    return amount
  }

  if (!shouldAbstract) {
    const strAmount = amount.toString()
    if (strAmount.includes('.')) {
      throw new InvalidParameterError(`Non-abstracted amount cannot have decimals: ${strAmount}`)
    }
    return BigInt(strAmount)
  }

  if (decimals === undefined) {
    const strAmount = amount.toString()
    if (strAmount.includes('.')) {
      // Return integer part only as fallback
      return BigInt(strAmount.split('.')[0])
    }
    return BigInt(strAmount)
  }

  return parseUnits(amount.toString(), decimals)
}
