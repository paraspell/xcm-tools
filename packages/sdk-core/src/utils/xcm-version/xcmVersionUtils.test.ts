import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DOT_LOCATION } from '../../constants'
import { getChainVersion } from '../chain'
import {
  addXcmVersionHeader,
  pickCompatibleXcmVersion,
  pickRouterCompatibleXcmVersion,
  selectXcmVersion
} from './xcmVersionUtils'

describe('addXcmVersionHeader', () => {
  it('should wrap object under xcm version key', () => {
    const payload = { amount: 123 }

    expect(addXcmVersionHeader(payload, Version.V3)).toEqual({
      [Version.V3]: payload
    })
  })
})

describe('selectXcmVersion', () => {
  it('should return forcedVersion when it is provided', () => {
    expect(selectXcmVersion(Version.V3, Version.V4, Version.V4)).toBe(Version.V3)
    expect(selectXcmVersion(Version.V4, Version.V3, Version.V3)).toBe(Version.V4)
  })

  it('should return originVersion when forcedVersion is undefined and destMaxVersion is undefined', () => {
    expect(selectXcmVersion(undefined, Version.V3, undefined)).toBe(Version.V3)
    expect(selectXcmVersion(undefined, Version.V4, undefined)).toBe(Version.V4)
  })

  it('should return originVersion when both originVersion and destMaxVersion are V4', () => {
    expect(selectXcmVersion(undefined, Version.V4, Version.V4)).toBe(Version.V4)
  })

  it('should downgrade to V3 when originVersion is V4 and destMaxVersion is V3', () => {
    expect(selectXcmVersion(undefined, Version.V4, Version.V3)).toBe(Version.V3)
  })

  it('should return originVersion (V3) when originVersion is V3 and destMaxVersion is V4', () => {
    expect(selectXcmVersion(undefined, Version.V3, Version.V4)).toBe(Version.V3)
  })

  it('should return originVersion (V3) when originVersion is V3 and destMaxVersion is V3', () => {
    expect(selectXcmVersion(undefined, Version.V3, Version.V3)).toBe(Version.V3)
  })
})

vi.mock('../chain')

describe('pickCompatibleXcmVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return override version when provided', () => {
    vi.mocked(getChainVersion).mockReturnValue(Version.V4)
    const result = pickCompatibleXcmVersion('Polkadot', 'Kusama', Version.V3)
    expect(result).toBe(Version.V3)
  })

  it('should not upgrade version when destination supports higher version', () => {
    vi.mocked(getChainVersion).mockReturnValueOnce(Version.V3).mockReturnValueOnce(Version.V4)
    const result = pickCompatibleXcmVersion('Polkadot', 'AssetHubPolkadot')
    expect(result).toBe(Version.V3)
  })

  it('should fallback to origin version when destination is TLocation', () => {
    vi.mocked(getChainVersion).mockReturnValue(Version.V4)

    const result = pickCompatibleXcmVersion('Polkadot', DOT_LOCATION)

    expect(result).toBe(Version.V4)
    expect(getChainVersion).toHaveBeenCalledTimes(1)
  })

  it('should downgrade when destination max version is lower', () => {
    vi.mocked(getChainVersion).mockReturnValueOnce(Version.V4).mockReturnValueOnce(Version.V3)
    const result = pickCompatibleXcmVersion('Polkadot', 'Kusama')
    expect(result).toBe(Version.V3)
  })

  it('should use origin version when both chains have same version', () => {
    vi.mocked(getChainVersion).mockReturnValue(Version.V4)
    const result = pickCompatibleXcmVersion('Polkadot', 'AssetHubPolkadot')
    expect(result).toBe(Version.V4)
  })
})

describe('pickRouterCompatibleXcmVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return exchange version when origin and destination are undefined', () => {
    vi.mocked(getChainVersion).mockReturnValue(Version.V4)
    const result = pickRouterCompatibleXcmVersion(undefined, 'AssetHubPolkadot', undefined)
    expect(result).toBe(Version.V4)
    expect(getChainVersion).toHaveBeenCalledTimes(1)
    expect(getChainVersion).toHaveBeenCalledWith('AssetHubPolkadot')
  })

  it('should return minimum version when origin has lower version', () => {
    vi.mocked(getChainVersion)
      .mockReturnValueOnce(Version.V4) // exchange
      .mockReturnValueOnce(Version.V3) // origin
    const result = pickRouterCompatibleXcmVersion('Polkadot', 'AssetHubPolkadot', undefined)
    expect(result).toBe(Version.V3)
  })

  it('should return minimum version when destination has lower version', () => {
    vi.mocked(getChainVersion)
      .mockReturnValueOnce(Version.V4) // exchange
      .mockReturnValueOnce(Version.V3) // destination
    const result = pickRouterCompatibleXcmVersion(undefined, 'AssetHubPolkadot', 'Kusama')
    expect(result).toBe(Version.V3)
  })

  it('should return minimum version across all three chains', () => {
    vi.mocked(getChainVersion)
      .mockReturnValueOnce(Version.V4) // exchange
      .mockReturnValueOnce(Version.V4) // origin
      .mockReturnValueOnce(Version.V3) // destination
    const result = pickRouterCompatibleXcmVersion('Polkadot', 'AssetHubPolkadot', 'Kusama')
    expect(result).toBe(Version.V3)
  })

  it('should return exchange version when all chains have same version', () => {
    vi.mocked(getChainVersion).mockReturnValue(Version.V4)
    const result = pickRouterCompatibleXcmVersion('Polkadot', 'AssetHubPolkadot', 'Kusama')
    expect(result).toBe(Version.V4)
  })

  it('should handle origin with lower version than exchange and destination', () => {
    vi.mocked(getChainVersion)
      .mockReturnValueOnce(Version.V4) // exchange
      .mockReturnValueOnce(Version.V3) // origin
      .mockReturnValueOnce(Version.V4) // destination
    const result = pickRouterCompatibleXcmVersion('Polkadot', 'AssetHubPolkadot', 'Kusama')
    expect(result).toBe(Version.V3)
  })
})
