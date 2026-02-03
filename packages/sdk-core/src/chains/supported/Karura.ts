// Contains detailed structure of XCM call construction for Karura Parachain

import { Version } from '@paraspell/sdk-common'

import Acala from './Acala'

class Karura<TApi, TRes, TSigner> extends Acala<TApi, TRes, TSigner> {
  constructor() {
    super('Karura', 'karura', 'Kusama', Version.V5)
  }
}

export default Karura
