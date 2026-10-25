import type { TAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'
import { NumberFormatError } from '../../errors'
import { isConfig } from '..'
import { parseUnits } from '../unit'

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
      // Silently dropping the fraction changed the transferred amount. Fail loudly:
      // the caller either has the wrong asset or forgot to pass planck.
      throw new NumberFormatError(
        `Cannot convert amount ${strAmount}: the resolved asset has no decimals. Pass the amount in planck units.`,
      )
    }
    return BigInt(strAmount)
  }

  return parseUnits(amount.toString(), decimals)
}
