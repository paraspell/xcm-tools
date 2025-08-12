import { Version } from '@paraspell/sdk-common'

import Laos from './Laos'

class LaosPaseo<TApi, TRes> extends Laos<TApi, TRes> {
  constructor() {
    super('LaosPaseo', 'laos-sigma', 'Paseo', Version.V4)
  }
}

export default LaosPaseo
