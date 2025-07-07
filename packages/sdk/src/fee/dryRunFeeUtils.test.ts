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
    const events = [createMockEvent('Assets', 'Deposited', 950)]
    const result = processAssetsDepositedEvents(events, 1000n)
    expect(result).toBe(950n)
  })

  it('should return sum when all events are <= 90% of amount', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 300),
      createMockEvent('Assets', 'Deposited', 200),
      createMockEvent('Assets', 'Deposited', 100)
    ]
    const result = processAssetsDepositedEvents(events, 1000n)
    expect(result).toBe(600n)
  })

  it('should remove largest event when sum > 90% and return remaining sum', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 300),
      createMockEvent('Assets', 'Deposited', 950),
      createMockEvent('Assets', 'Deposited', 200)
    ]
    const result = processAssetsDepositedEvents(events, 1000n)
    expect(result).toBe(500n)
  })

  it('should return undefined when all events must be removed', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 460),
      createMockEvent('Assets', 'Deposited', 480)
    ]
    const result = processAssetsDepositedEvents(events, 500n)
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
