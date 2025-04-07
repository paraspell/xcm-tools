import { isOverrideMultiLocationSpecifier, type TCurrencyInput } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type ParachainNode from '../../nodes/ParachainNode'
import { getNode } from '../../utils'
import { determineAssetCheckEnabled } from './determineAssetCheckEnabled'

vi.mock('../../utils', () => ({
  getNode: vi.fn(),
  isRelayChain: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  isOverrideMultiLocationSpecifier: vi.fn()
}))

describe('determineAssetCheckEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false if "multiasset" is in currency', () => {
    const origin = 'Acala' as TNodePolkadotKusama
    const currency = { multiasset: [] } as TCurrencyInput

    const originNode = { assetCheckEnabled: true } as ParachainNode<unknown, unknown>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency)

    expect(result).toBe(false)
  })

  it('should return false if "multilocation" is in currency and isOverrideMultiLocationSpecifier returns true', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = { multilocation: {} } as TCurrencyInput

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)
    const originNode = { assetCheckEnabled: true } as ParachainNode<unknown, unknown>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency)

    expect(result).toBe(false)
  })

  it('should return originNode.assetCheckEnabled when none of the conditions are met', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = {} as TCurrencyInput

    const originNode = { assetCheckEnabled: true } as ParachainNode<unknown, unknown>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency)

    expect(result).toBe(true)
  })

  it('should return originNode.assetCheckEnabled (false) when none of the conditions are met', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = {} as TCurrencyInput

    const originNode = { assetCheckEnabled: false } as ParachainNode<unknown, unknown>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency)

    expect(result).toBe(false)
  })

  it('should prioritize "multiasset" in currency over other conditions', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = { multiasset: {} } as TCurrencyInput

    const originNode = { assetCheckEnabled: true } as ParachainNode<unknown, unknown>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency)

    expect(result).toBe(false)
  })

  it('should return false when both "multilocation" in currency and isOverrideMultiLocationSpecifier returns true, even if isBridge is false', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = { multilocation: {} } as TCurrencyInput

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)
    const originNode = { assetCheckEnabled: true } as ParachainNode<unknown, unknown>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency)

    expect(result).toBe(false)
  })

  it('should return originNode.assetCheckEnabled when "multilocation" in currency but isOverrideMultiLocationSpecifier returns false', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = { multilocation: {} } as TCurrencyInput

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false)
    const originNode = { assetCheckEnabled: true } as ParachainNode<unknown, unknown>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency)

    expect(result).toBe(true)
  })

  it('should return false when isBridge is true, regardless of other conditions', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = {} as TCurrencyInput

    const originNode = { assetCheckEnabled: false } as ParachainNode<unknown, unknown>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency)

    expect(result).toBe(false)
  })
})
