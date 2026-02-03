import type { TAmount } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
import { NumberFormatError } from '../../errors'
import { isConfig } from '..'
import { parseUnits } from '../unit'

export const abstractDecimals = <TApi, TRes, TSigner>(
  amount: TAmount,
  decimals: number | undefined,
  api: IPolkadotApi<TApi, TRes, TSigner>
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
      throw new NumberFormatError(`Non-abstracted amount cannot have decimals: ${strAmount}`)
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
