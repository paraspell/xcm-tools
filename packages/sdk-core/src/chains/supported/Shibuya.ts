// Contains detailed structure of XCM call construction for Shibuya Parachain

import { Version } from '@paraspell/sdk-common'

import Astar from './Astar'

class Shibuya<TApi, TRes, TSigner, TCustomChain extends string = never> extends Astar<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('Shibuya', 'PaseoShibuyaChain', 'Paseo', Version.V5)
  }
}

export default Shibuya
