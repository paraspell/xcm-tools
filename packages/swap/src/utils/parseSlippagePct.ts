import { ValidationError } from '@paraspell/sdk-core'

/**
 * Slippage is a percentage of the quoted output. It is type-required on
 * TGenericSwapOptions but was never checked at runtime: an omitted value became
 * `Number(undefined)` to NaN and crashed deep inside BigInt conversion with a
 * RangeError that says nothing about slippage.
 */
export const parseSlippagePct = (value: string): number => {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new ValidationError(
      'slippagePct is required: pass a percentage between 0 (inclusive) and 100 (exclusive).',
    )
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new ValidationError(
      `slippagePct must be a finite number, received "${String(value)}".`,
    )
  }

  if (parsed < 0 || parsed >= 100) {
    throw new ValidationError(
      `slippagePct must be greater than or equal to 0 and less than 100, received ${parsed}.`,
    )
  }

  return parsed
}
