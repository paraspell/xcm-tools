import type { Version } from '@paraspell/sdk-common'

import type { OneKey } from '../types'

export const addXcmVersionHeader = <T, V extends Version>(obj: T, version: V) =>
  ({ [version]: obj }) as OneKey<V, T>
