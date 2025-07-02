import { describe, expect, it } from 'vitest'

import { processAssetsDepositedEvents } from './dryRunFeeUtils'

const createMockEvent = (type: string, valueType: string, amount: string | number) => ({
  type,
  value: {
    type: valueType,
    value: {
      amount: amount.toString()
    }
  }
})

describe('processAssetsDepositedEvents', () => {
  it('should return undefined when no Assets Deposited events exist', () => {
    const events = [
      createMockEvent('Balances', 'Deposited', 500),
      createMockEvent('Assets', 'Issued', 200)
    ]
    const result = processAssetsDepositedEvents(events, 1000n)
    expect(result).toBeUndefined()
  })

  it('should return the amount for single Assets Deposited event', () => {
    const events = [createMockEvent('Assets', 'Deposited', 500)]
    const result = processAssetsDepositedEvents(events, 1000n)
    expect(result).toBe(500n)
  })

  it('should return 0 for single event with zero amount', () => {
    const events = [createMockEvent('Assets', 'Deposited', 0)]
    const result = processAssetsDepositedEvents(events, 1000n)
    expect(result).toEqual(0n)
  })

  it('should remove largest amount and return sum of remaining for multiple events', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 300),
      createMockEvent('Assets', 'Deposited', 500), // largest - removed
      createMockEvent('Assets', 'Deposited', 200)
    ]
    const result = processAssetsDepositedEvents(events, 1000n)
    expect(result).toBe(500n) // 300 + 200
  })

  it('should remove additional events when sum exceeds amount limit', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 400),
      createMockEvent('Assets', 'Deposited', 600), // removed first
      createMockEvent('Assets', 'Deposited', 500) // removed second (sum > limit)
    ]
    const result = processAssetsDepositedEvents(events, 500n)
    expect(result).toBe(400n)
  })

  it('should return undefined when all events must be removed due to amount limit', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 600),
      createMockEvent('Assets', 'Deposited', 500)
    ]
    const result = processAssetsDepositedEvents(events, 100n)
    expect(result).toBeUndefined()
  })

  it('should handle BigInt values correctly', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', '999999999999999999999'),
      createMockEvent('Assets', 'Deposited', '111111111111111111111')
    ]
    const result = processAssetsDepositedEvents(events, 500000000000000000000n)
    expect(result).toBe(111111111111111111111n)
  })
})
