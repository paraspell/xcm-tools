import { Version } from '@paraspell/sdk-common'

import Heima from './Heima'

class HeimaPaseo<TApi, TRes, TSigner> extends Heima<TApi, TRes, TSigner> {
  constructor() {
    super('HeimaPaseo', 'heima-paseo', 'Paseo', Version.V5)
  }
}

export default HeimaPaseo
