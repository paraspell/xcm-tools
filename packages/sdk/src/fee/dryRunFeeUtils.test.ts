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
  it('should return undefined when no matching pallet/method events exist', () => {
    const events = [
      createMockEvent('Balances', 'Deposited', 500),
      createMockEvent('Assets', 'Issued', 200)
    ]
    const result = processAssetsDepositedEvents(events, 1000n, 'Assets', 'Deposited')
    expect(result).toBeUndefined()
  })

  it('should return the amount for single matching event with returnOnOneEvent true', () => {
    const events = [createMockEvent('Assets', 'Deposited', 950)]
    const result = processAssetsDepositedEvents(events, 1000n, 'Assets', 'Deposited')
    expect(result).toBe(950n)
  })

  it('should return undefined for single matching event > 90% with returnOnOneEvent false', () => {
    const events = [createMockEvent('Assets', 'Deposited', 950)]
    const result = processAssetsDepositedEvents(events, 1000n, 'Assets', 'Deposited', false)
    expect(result).toBeUndefined()
  })

  it('should return the amount for single matching event <= 90% with returnOnOneEvent false', () => {
    const events = [createMockEvent('Assets', 'Deposited', 850)]
    const result = processAssetsDepositedEvents(events, 1000n, 'Assets', 'Deposited', false)
    expect(result).toBe(850n)
  })

  it('should return sum when all events are <= 90% of amount', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 300),
      createMockEvent('Assets', 'Deposited', 200),
      createMockEvent('Assets', 'Deposited', 100)
    ]
    const result = processAssetsDepositedEvents(events, 1000n, 'Assets', 'Deposited')
    expect(result).toBe(600n)
  })

  it('should remove largest event when sum > 90% and return remaining sum', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 300),
      createMockEvent('Assets', 'Deposited', 950),
      createMockEvent('Assets', 'Deposited', 200)
    ]
    const result = processAssetsDepositedEvents(events, 1000n, 'Assets', 'Deposited')
    expect(result).toBe(500n)
  })

  it('should return undefined when all events must be removed', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 460),
      createMockEvent('Assets', 'Deposited', 480)
    ]
    const result = processAssetsDepositedEvents(events, 500n, 'Assets', 'Deposited')
    expect(result).toBeUndefined()
  })

  it('should handle BigInt values correctly', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', '999999999999999999999'),
      createMockEvent('Assets', 'Deposited', '111111111111111111111')
    ]
    const result = processAssetsDepositedEvents(
      events,
      500000000000000000000n,
      'Assets',
      'Deposited'
    )
    expect(result).toBe(111111111111111111111n)
  })

  it('should work with different pallet and method names', () => {
    const events = [
      createMockEvent('CustomPallet', 'CustomMethod', 400),
      createMockEvent('CustomPallet', 'CustomMethod', 300),
      createMockEvent('Assets', 'Deposited', 500)
    ]
    const result = processAssetsDepositedEvents(events, 1000n, 'CustomPallet', 'CustomMethod')
    expect(result).toBe(700n)
  })

  it('should filter events by both pallet and method correctly', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 300),
      createMockEvent('Assets', 'Issued', 400),
      createMockEvent('Balances', 'Deposited', 500),
      createMockEvent('Assets', 'Deposited', 200)
    ]
    const result = processAssetsDepositedEvents(events, 1000n, 'Assets', 'Deposited')
    expect(result).toBe(500n)
  })

  it('should remove single event > 90% when returnOnOneEvent is false', () => {
    const events = [createMockEvent('Assets', 'Deposited', 950)]
    const result = processAssetsDepositedEvents(events, 1000n, 'Assets', 'Deposited', false)
    expect(result).toBeUndefined()
  })

  it('should process multiple events with returnOnOneEvent false', () => {
    const events = [
      createMockEvent('Assets', 'Deposited', 300),
      createMockEvent('Assets', 'Deposited', 400)
    ]
    const result = processAssetsDepositedEvents(events, 1000n, 'Assets', 'Deposited', false)
    expect(result).toBe(700n)
  })
})
