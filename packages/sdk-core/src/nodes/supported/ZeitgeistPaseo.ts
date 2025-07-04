import { Version } from '@paraspell/sdk-common'

import Zeitgeist from './Zeitgeist'

class ZeitgeistPaseo<TApi, TRes> extends Zeitgeist<TApi, TRes> {
  constructor() {
    super('ZeitgeistPaseo', 'ZeitgeistBatteryStation', 'paseo', Version.V3)
  }
}

export default ZeitgeistPaseo
