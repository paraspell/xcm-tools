import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getNode } from '../../../utils'
import { isOverrideMultiLocationSpecifier } from '../../../utils/multiLocation/isOverrideMultiLocationSpecifier'
import type { TCurrencyInput, TNodePolkadotKusama } from '../../../types'
import { determineAssetCheckEnabled } from './determineAssetCheckEnabled'
import type ParachainNode from '../../../nodes/ParachainNode'
import type { Extrinsic, TPjsApi } from '../../../pjs'

vi.mock('../../../utils', () => ({
  getNode: vi.fn(),
  isRelayChain: vi.fn()
}))

vi.mock('../../../utils/multiLocation/isOverrideMultiLocationSpecifier', () => ({
  isOverrideMultiLocationSpecifier: vi.fn()
}))

describe('determineAssetCheckEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false if "multiasset" is in currency', () => {
    const origin = 'Acala' as TNodePolkadotKusama
    const currency = { multiasset: [] } as TCurrencyInput
    const isBridge = false

    const originNode = { assetCheckEnabled: true } as ParachainNode<TPjsApi, Extrinsic>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency, isBridge)

    expect(result).toBe(false)
  })

  it('should return false if "multilocation" is in currency and isOverrideMultiLocationSpecifier returns true', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = { multilocation: {} } as TCurrencyInput
    const isBridge = false

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)
    const originNode = { assetCheckEnabled: true } as ParachainNode<TPjsApi, Extrinsic>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency, isBridge)

    expect(result).toBe(false)
  })

  it('should return false if isBridge is true', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = {} as TCurrencyInput
    const isBridge = true

    const originNode = { assetCheckEnabled: true } as ParachainNode<TPjsApi, Extrinsic>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency, isBridge)

    expect(result).toBe(false)
  })

  it('should return originNode.assetCheckEnabled when none of the conditions are met', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = {} as TCurrencyInput
    const isBridge = false

    const originNode = { assetCheckEnabled: true } as ParachainNode<TPjsApi, Extrinsic>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency, isBridge)

    expect(result).toBe(true)
  })

  it('should return originNode.assetCheckEnabled (false) when none of the conditions are met', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = {} as TCurrencyInput
    const isBridge = false

    const originNode = { assetCheckEnabled: false } as ParachainNode<TPjsApi, Extrinsic>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency, isBridge)

    expect(result).toBe(false)
  })

  it('should prioritize "multiasset" in currency over other conditions', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = { multiasset: {} } as TCurrencyInput
    const isBridge = true

    const originNode = { assetCheckEnabled: true } as ParachainNode<TPjsApi, Extrinsic>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency, isBridge)

    expect(result).toBe(false)
  })

  it('should return false when both "multilocation" in currency and isOverrideMultiLocationSpecifier returns true, even if isBridge is false', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = { multilocation: {} } as TCurrencyInput
    const isBridge = false

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)
    const originNode = { assetCheckEnabled: true } as ParachainNode<TPjsApi, Extrinsic>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency, isBridge)

    expect(result).toBe(false)
  })

  it('should return originNode.assetCheckEnabled when "multilocation" in currency but isOverrideMultiLocationSpecifier returns false', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = { multilocation: {} } as TCurrencyInput
    const isBridge = false

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false)
    const originNode = { assetCheckEnabled: true } as ParachainNode<TPjsApi, Extrinsic>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency, isBridge)

    expect(result).toBe(true)
  })

  it('should return false when isBridge is true, regardless of other conditions', () => {
    const origin = {} as TNodePolkadotKusama
    const currency = {} as TCurrencyInput
    const isBridge = true

    const originNode = { assetCheckEnabled: false } as ParachainNode<TPjsApi, Extrinsic>
    vi.mocked(getNode).mockReturnValue(originNode)

    const result = determineAssetCheckEnabled(origin, currency, isBridge)

    expect(result).toBe(false)
  })
})
