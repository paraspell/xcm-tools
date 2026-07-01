import { Version } from '@paraspell/sdk-common'

import Hydration from './Hydration'

class HydrationPaseo<TApi, TRes, TSigner, TCustomChain extends string = never> extends Hydration<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('HydrationPaseo', 'rococoHydraDX', 'Paseo', Version.V5)
  }
}

export default HydrationPaseo
