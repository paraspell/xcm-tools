import { Version } from '@paraspell/sdk-common'

import Laos from './Laos'

class LaosPaseo<TApi, TRes, TSigner> extends Laos<TApi, TRes, TSigner> {
  constructor() {
    super('LaosPaseo', 'laos-sigma', 'Paseo', Version.V4)
  }
}

export default LaosPaseo
