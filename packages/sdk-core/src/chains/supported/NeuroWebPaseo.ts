import { Version } from '@paraspell/sdk-common'

import NeuroWeb from './NeuroWeb'

class NeuroWebPaseo<TApi, TRes, TSigner, TCustomChain extends string = never> extends NeuroWeb<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('NeuroWebPaseo', 'NeuroWeb', 'Paseo', Version.V4)
  }
}

export default NeuroWebPaseo
