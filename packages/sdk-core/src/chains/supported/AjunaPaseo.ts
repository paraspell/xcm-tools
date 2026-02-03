import { Version } from '@paraspell/sdk-common'

import Ajuna from './Ajuna'

class AjunaPaseo<TApi, TRes, TSigner> extends Ajuna<TApi, TRes, TSigner> {
  constructor() {
    super('AjunaPaseo', 'Ajuna(paseo)', 'Paseo', Version.V5)
  }
}

export default AjunaPaseo
