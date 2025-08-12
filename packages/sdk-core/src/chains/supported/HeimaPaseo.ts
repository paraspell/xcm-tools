import { Version } from '@paraspell/sdk-common'

import Heima from './Heima'

class HeimaPaseo<TApi, TRes> extends Heima<TApi, TRes> {
  constructor() {
    super('HeimaPaseo', 'heima-paseo', 'Paseo', Version.V5)
  }
}

export default HeimaPaseo
