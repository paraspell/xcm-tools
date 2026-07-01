import { Version } from '@paraspell/sdk-common'

import Collectives from './Collectives'

class CollectivesWestend<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends Collectives<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('CollectivesWestend', 'westendCollectives', 'Westend', Version.V5)
  }
}

export default CollectivesWestend
