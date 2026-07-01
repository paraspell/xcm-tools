// Contains detailed structure of XCM call construction for the EnergyWebXPaseo Parachain

import { Version } from '@paraspell/sdk-common'

import EnergyWebX from './EnergyWebX'

class EnergyWebXPaseo<TApi, TRes, TSigner, TCustomChain extends string = never> extends EnergyWebX<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('EnergyWebXPaseo', 'paseoEwx', 'Paseo', Version.V5)
  }
}

export default EnergyWebXPaseo
