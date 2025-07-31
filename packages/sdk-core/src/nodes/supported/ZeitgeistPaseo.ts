import { Version } from '@paraspell/sdk-common'

import Zeitgeist from './Zeitgeist'

class ZeitgeistPaseo<TApi, TRes> extends Zeitgeist<TApi, TRes> {
  constructor() {
    super('ZeitgeistPaseo', 'ZeitgeistBatteryStation', 'paseo', Version.V4)
  }
}

export default ZeitgeistPaseo
