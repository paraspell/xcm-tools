import { Version } from '@paraspell/sdk-common'

import NeuroWeb from './NeuroWeb'

class NeuroWebPaseo<TApi, TRes> extends NeuroWeb<TApi, TRes> {
  constructor() {
    super('NeuroWebPaseo', 'NeuroWeb', 'paseo', Version.V4)
  }
}

export default NeuroWebPaseo
