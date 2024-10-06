import type { Junctions, TJunction } from '../types'
import { Version } from '../types'

export const createX1Payload = (version: Version, junction: TJunction): Junctions =>
  version === Version.V4 ? { X1: [junction] } : { X1: junction }
