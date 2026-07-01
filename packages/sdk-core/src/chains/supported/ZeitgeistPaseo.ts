import { Version } from '@paraspell/sdk-common'

import Zeitgeist from './Zeitgeist'

class ZeitgeistPaseo<TApi, TRes, TSigner, TCustomChain extends string = never> extends Zeitgeist<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('ZeitgeistPaseo', 'ZeitgeistBatteryStation', 'Paseo', Version.V4)
  }
}

export default ZeitgeistPaseo
