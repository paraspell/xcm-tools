import { Version } from '@paraspell/sdk-common'

import Collectives from './Collectives'

class CollectivesWestend<TApi, TRes, TSigner> extends Collectives<TApi, TRes, TSigner> {
  constructor() {
    super('CollectivesWestend', 'westendCollectives', 'Westend', Version.V5)
  }
}

export default CollectivesWestend
