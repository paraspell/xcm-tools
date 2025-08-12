import { Version } from '@paraspell/sdk-common'

import Hydration from './Hydration'

class HydrationPaseo<TApi, TRes> extends Hydration<TApi, TRes> {
  constructor() {
    super('HydrationPaseo', 'rococoHydraDX', 'Paseo', Version.V4)
  }
}

export default HydrationPaseo
