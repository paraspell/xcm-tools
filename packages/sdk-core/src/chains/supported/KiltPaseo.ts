import { Version } from '@paraspell/sdk-common'

import KiltSpiritnet from './KiltSpiritnet'

class KiltPaseo<TApi, TRes> extends KiltSpiritnet<TApi, TRes> {
  constructor() {
    super('KiltPaseo', 'kilt', 'paseo', Version.V4)
  }
}

export default KiltPaseo
