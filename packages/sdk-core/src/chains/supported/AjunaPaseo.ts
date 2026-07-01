import { Version } from '@paraspell/sdk-common'

import Ajuna from './Ajuna'

class AjunaPaseo<TApi, TRes, TSigner, TCustomChain extends string = never> extends Ajuna<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('AjunaPaseo', 'Ajuna(paseo)', 'Paseo', Version.V5)
  }
}

export default AjunaPaseo
