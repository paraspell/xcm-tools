import type { TAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'
import { NumberFormatError } from '../../errors'
import { isConfig } from '..'
import { parseUnits } from '../unit'

const assertFractionFitsDecimals = (strAmount: string, decimals: number): void => {
  const dotIndex = strAmount.indexOf('.')
  if (dotIndex === -1) return

  const fraction = strAmount.slice(dotIndex + 1)
  // Exponent notation is not a decimal digit string. parseUnits rejects it instead of rounding.
  if (!/^\d*$/.test(fraction)) return

  // Trailing zeros do not add precision ("1.50" fits 1 decimal, "1.0" fits 0).
  const significantFraction = fraction.replace(/0+$/, '')
  if (significantFraction.length > decimals) {
    throw new NumberFormatError(
      `Amount ${strAmount} has more fractional digits than the asset decimals (${decimals})`
    )
  }
}

export const abstractDecimals = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  amount: TAmount,
  decimals: number | undefined,
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
): bigint => {
  const { config } = api
  const abstractDecimals = !(isConfig(config) && config.abstractDecimals === false)

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

  const strAmount = amount.toString()
  assertFractionFitsDecimals(strAmount, decimals)
  return parseUnits(strAmount, decimals)
}
