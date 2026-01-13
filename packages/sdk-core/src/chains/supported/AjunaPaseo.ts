import { Version } from '@paraspell/sdk-common'

import Ajuna from './Ajuna'

class AjunaPaseo<TApi, TRes> extends Ajuna<TApi, TRes> {
  constructor() {
    super('AjunaPaseo', 'Ajuna(paseo)', 'Paseo', Version.V5)
  }
}

export default AjunaPaseo
