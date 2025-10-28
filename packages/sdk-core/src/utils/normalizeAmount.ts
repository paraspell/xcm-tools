import { MIN_AMOUNT } from '../constants'

export const normalizeAmount = (amount: bigint) => (amount < MIN_AMOUNT ? MIN_AMOUNT : amount)
