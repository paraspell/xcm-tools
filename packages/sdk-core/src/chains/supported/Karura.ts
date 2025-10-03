// Contains detailed structure of XCM call construction for Karura Parachain

import { Version } from '@paraspell/sdk-common'

import Acala from './Acala'

class Karura<TApi, TRes> extends Acala<TApi, TRes> {
  constructor() {
    super('Karura', 'karura', 'Kusama', Version.V4)
  }
}

export default Karura
