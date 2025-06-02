import { isOverrideMultiLocationSpecifier, type TCurrencyInput } from '@paraspell/assets'
import { isRelayChain, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { shouldPerformAssetCheck } from './shouldPerformAssetCheck'

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  isOverrideMultiLocationSpecifier: vi.fn()
}))

describe('shouldPerformAssetCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true if origin is a relay chain', () => {
    const origin = {} as TNodeDotKsmWithRelayChains
    const currency = {} as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(true)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(true)
  })

  it('returns false if "multiasset" is in currency', () => {
    const origin = {} as TNodeDotKsmWithRelayChains
    const currency = { multiasset: {} } as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(false)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(false)
  })

  it('returns false if "multilocation" is in currency and isOverrideMultiLocationSpecifier returns true', () => {
    const origin = {} as TNodeDotKsmWithRelayChains
    const currency = { multilocation: {} } as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(false)
  })

  it('returns true if neither "multiasset" nor overridden "multilocation" is present', () => {
    const origin = {} as TNodeDotKsmWithRelayChains
    const currency = {} as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(false)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(true)
  })

  it('returns true if "multilocation" exists but override is false', () => {
    const origin = {} as TNodeDotKsmWithRelayChains
    const currency = { multilocation: {} } as TCurrencyInput

    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false)

    const result = shouldPerformAssetCheck(origin, currency)
    expect(result).toBe(true)
  })
})
