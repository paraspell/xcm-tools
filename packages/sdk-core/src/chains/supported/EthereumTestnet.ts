import { Version } from '@paraspell/sdk-common'

import Ethereum from './Ethereum'

class EthereumTestnet<TApi, TRes, TSigner> extends Ethereum<TApi, TRes, TSigner> {
  constructor() {
    super('EthereumTestnet', 'Paseo', Version.V5)
  }
}

export default EthereumTestnet
