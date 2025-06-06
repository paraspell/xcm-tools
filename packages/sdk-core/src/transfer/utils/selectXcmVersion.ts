import { Version } from '@paraspell/sdk-common'

export const selectXcmVersion = (
  forcedVersion: Version | undefined,
  originVersion: Version,
  destMaxVersion?: Version
): Version => {
  if (forcedVersion) {
    return forcedVersion
  }

  const destVersion = destMaxVersion ?? originVersion

  if (originVersion === Version.V4 && destVersion === Version.V3) {
    return Version.V3
  }

  return originVersion
}
