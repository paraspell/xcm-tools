import { Version } from '@paraspell/sdk-common'

import Moonbeam from './Moonbeam'

class Penpal<TApi, TRes> extends Moonbeam<TApi, TRes> {
  constructor() {
    super('Penpal', 'westendPenpal', 'westend', Version.V4)
  }
}

export default Penpal
