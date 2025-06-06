import { type TJunction, type TJunctions, Version } from '@paraspell/sdk-common'

export const createX1Payload = (version: Version, junction: TJunction): TJunctions =>
  version === Version.V3 ? { X1: junction } : { X1: [junction] }
