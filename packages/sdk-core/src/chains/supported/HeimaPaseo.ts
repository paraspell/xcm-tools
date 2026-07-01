import { Version } from '@paraspell/sdk-common'

import Heima from './Heima'

class HeimaPaseo<TApi, TRes, TSigner, TCustomChain extends string = never> extends Heima<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('HeimaPaseo', 'heima-paseo', 'Paseo', Version.V5)
  }
}

export default HeimaPaseo
