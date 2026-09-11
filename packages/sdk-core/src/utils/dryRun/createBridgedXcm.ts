import type { Version } from '@paraspell/sdk-common'

import type { TBridgedXcmParams } from '../../types'
import { createX1Payload } from '../location'

export const createBridgedXcmPrefix = (
  version: Version,
  { palletIndex, relay, paraId }: TBridgedXcmParams
) => [
  { DescendOrigin: createX1Payload(version, { PalletInstance: palletIndex }) },
  { UniversalOrigin: { GlobalConsensus: { [relay.toLowerCase()]: null } } },
  { DescendOrigin: createX1Payload(version, { Parachain: paraId }) }
]
