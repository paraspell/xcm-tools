import { Version } from '@paraspell/sdk-common'

import Heima from './Heima'

class HeimaPaseo<TApi, TRes> extends Heima<TApi, TRes> {
  constructor() {
    super('HeimaPaseo', 'heima-paseo', 'paseo', Version.V4)
  }
}

export default HeimaPaseo
