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

const toDecimalString = (amount: TAmount): string => {
  if (typeof amount === 'bigint') return amount.toString()
  const str = amount.toString()
  if (!/[eE]/.test(str)) return str

  const [mantissa, exponent] = str.toLowerCase().split('e')
  if (exponent === undefined || isNaN(Number(exponent))) return str

  const sign = str.startsWith('-') ? '-' : ''
  const cleanMantissa = mantissa.replace(/^[+-]/, '')
  const [integerPart, fractionalPart = ''] = cleanMantissa.split('.')
  const exp = Number(exponent)

  if (exp > 0) {
    if (exp >= fractionalPart.length) {
      return sign + integerPart + fractionalPart + '0'.repeat(exp - fractionalPart.length)
    } else {
      return sign + integerPart + fractionalPart.slice(0, exp) + '.' + fractionalPart.slice(exp)
    }
  } else if (exp < 0) {
    const absExp = Math.abs(exp)
    if (absExp <= integerPart.length) {
      const idx = integerPart.length - absExp
      const left = integerPart.slice(0, idx)
      const right = integerPart.slice(idx) + fractionalPart
      return sign + (left || '0') + '.' + right
    } else {
      return sign + '0.' + '0'.repeat(absExp - integerPart.length) + integerPart + fractionalPart
    }
  } else {
    return sign + cleanMantissa
  }
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

  const strAmount = toDecimalString(amount)

  if (!shouldAbstract) {
    if (strAmount.includes('.')) {
      throw new NumberFormatError(`Non-abstracted amount cannot have decimals: ${strAmount}`)
    }
    return BigInt(strAmount)
  }

  if (decimals === undefined) {
    if (strAmount.includes('.')) {
      // Return integer part only as fallback
      return BigInt(strAmount.split('.')[0])
    }
    return BigInt(strAmount)
  }

  return parseUnits(strAmount, decimals)
}
