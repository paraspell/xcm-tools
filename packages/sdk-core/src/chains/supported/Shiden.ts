// Contains detailed structure of XCM call construction for Shiden Parachain

import { Version } from '@paraspell/sdk-common'

import Astar from './Astar'

class Shiden<TApi, TRes> extends Astar<TApi, TRes> {
  constructor() {
    super('Shiden', 'shiden', 'Kusama', Version.V5)
  }
}

export default Shiden
