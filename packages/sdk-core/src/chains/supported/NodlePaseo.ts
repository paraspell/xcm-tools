import { Version } from '@paraspell/sdk-common'

import Nodle from './Nodle'

class NodlePaseo<TApi, TRes> extends Nodle<TApi, TRes> {
  constructor() {
    super('NodlePaseo', 'NodleParadis', 'Paseo', Version.V4)
  }
}

export default NodlePaseo
