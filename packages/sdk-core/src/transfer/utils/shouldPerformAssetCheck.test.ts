import { isOverrideLocationSpecifier, type TCurrencyInput } from '@paraspell/assets'
import { isRelayChain, type TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { shouldPerformAssetCheck } from './shouldPerformAssetCheck'

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  isOverrideLocationSpecifier: vi.fn()
}))

describe('shouldPerformAssetCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true if origin is a relay chain', () => {
    const origin = {} as TSubstrateChain
    const currency = {} as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(true)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(true)
  })

  it('returns false if "multiasset" is in currency', () => {
    const origin = {} as TSubstrateChain
    const currency = { multiasset: {} } as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(false)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(false)
  })

  it('returns false if "location" is in currency and isOverrideLocationSpecifier returns true', () => {
    const origin = {} as TSubstrateChain
    const currency = { location: {} } as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(false)
  })

  it('returns true if neither "multiasset" nor overridden "location" is present', () => {
    const origin = {} as TSubstrateChain
    const currency = {} as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(false)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(true)
  })

  it('returns true if "location" exists but override is false', () => {
    const origin = {} as TSubstrateChain
    const currency = { location: {} } as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(true)
  })
})
