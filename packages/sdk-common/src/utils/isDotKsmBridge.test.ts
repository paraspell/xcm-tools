import { describe, expect, it } from 'vitest'

import { isDotKsmBridge } from './isDotKsmBridge'

describe('isDotKsmBridge', () => {
  it('should return true when origin is AssetHubPolkadot and destination is AssetHubKusama', () => {
    const origin = 'AssetHubPolkadot'
    const destination = 'AssetHubKusama'
    const result = isDotKsmBridge(origin, destination)
    expect(result).toBe(true)
  })

  it('should return true when origin is AssetHubKusama and destination is AssetHubPolkadot', () => {
    const origin = 'AssetHubKusama'
    const destination = 'AssetHubPolkadot'
    const result = isDotKsmBridge(origin, destination)
    expect(result).toBe(true)
  })

  it('should return false when origin and destination are both AssetHubPolkadot', () => {
    const origin = 'AssetHubPolkadot'
    const destination = 'AssetHubPolkadot'
    const result = isDotKsmBridge(origin, destination)
    expect(result).toBe(false)
  })

  it('should return false when origin and destination are both AssetHubKusama', () => {
    const origin = 'AssetHubKusama'
    const destination = 'AssetHubKusama'
    const result = isDotKsmBridge(origin, destination)
    expect(result).toBe(false)
  })

  it('should return false when origin is AssetHubPolkadot and destination is relaychain', () => {
    const origin = 'AssetHubPolkadot'
    const destination = 'Polkadot'
    const result = isDotKsmBridge(origin, destination)
    expect(result).toBe(false)
  })

  it('should return false when origin is AssetHubKusama and destination is relaychain', () => {
    const origin = 'AssetHubKusama'
    const destination = 'Kusama'
    const result = isDotKsmBridge(origin, destination)
    expect(result).toBe(false)
  })

  it('should return false when origin is AssetHubPolkadot and destination is SomeOtherDestination', () => {
    const origin = 'AssetHubPolkadot'
    const destination = 'Acala'
    const result = isDotKsmBridge(origin, destination)
    expect(result).toBe(false)
  })

  it('should return false when origin is SomeOtherOrigin and destination is AssetHubKusama', () => {
    const origin = 'Unique'
    const destination = 'AssetHubKusama'
    const result = isDotKsmBridge(origin, destination)
    expect(result).toBe(false)
  })
})
