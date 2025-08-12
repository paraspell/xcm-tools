import { Version } from '@paraspell/sdk-common'

import Collectives from './Collectives'

class CollectivesWestend<TApi, TRes> extends Collectives<TApi, TRes> {
  constructor() {
    super('CollectivesWestend', 'westendCollectives', 'Westend', Version.V5)
  }
}

export default CollectivesWestend
