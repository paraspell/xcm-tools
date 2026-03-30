import { Version } from '@paraspell/sdk-common'

import Hydration from './Hydration'

class HydrationPaseo<TApi, TRes, TSigner> extends Hydration<TApi, TRes, TSigner> {
  constructor() {
    super('HydrationPaseo', 'rococoHydraDX', 'Paseo', Version.V5)
  }
}

export default HydrationPaseo
