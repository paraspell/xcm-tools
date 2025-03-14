import type { TJunction, TJunctions } from '@paraspell/sdk-common'

import { Version } from '../types'

export const createX1Payload = (version: Version, junction: TJunction): TJunctions =>
  version === Version.V4 ? { X1: [junction] } : { X1: junction }
