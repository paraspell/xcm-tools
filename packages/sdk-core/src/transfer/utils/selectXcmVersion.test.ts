import { Version } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { selectXcmVersion } from './selectXcmVersion'

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
