import { Version } from '@paraspell/sdk-common'

import Zeitgeist from './Zeitgeist'

class ZeitgeistPaseo<TApi, TRes, TSigner> extends Zeitgeist<TApi, TRes, TSigner> {
  constructor() {
    super('ZeitgeistPaseo', 'ZeitgeistBatteryStation', 'Paseo', Version.V4)
  }
}

export default ZeitgeistPaseo
