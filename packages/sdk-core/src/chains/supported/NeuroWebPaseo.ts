import { Version } from '@paraspell/sdk-common'

import NeuroWeb from './NeuroWeb'

class NeuroWebPaseo<TApi, TRes, TSigner> extends NeuroWeb<TApi, TRes, TSigner> {
  constructor() {
    super('NeuroWebPaseo', 'NeuroWeb', 'Paseo', Version.V4)
  }
}

export default NeuroWebPaseo
