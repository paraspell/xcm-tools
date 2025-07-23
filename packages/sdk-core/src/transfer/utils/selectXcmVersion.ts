import type { Version } from '@paraspell/sdk-common'

export const selectXcmVersion = (
  forcedVersion: Version | undefined,
  originVersion: Version,
  destMaxVersion?: Version
): Version => {
  if (forcedVersion) return forcedVersion

  const destVersion = destMaxVersion ?? originVersion

  return destVersion < originVersion ? destVersion : originVersion
}
