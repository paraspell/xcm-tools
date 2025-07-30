// Contains detailed structure of XCM call construction for the EnergyWebXPaseo Parachain

import { Version } from '@paraspell/sdk-common'

import EnergyWebX from './EnergyWebX'

class EnergyWebXPaseo<TApi, TRes> extends EnergyWebX<TApi, TRes> {
  constructor() {
    super('EnergyWebXPaseo', 'paseoEwx', 'paseo', Version.V3)
  }
}

export default EnergyWebXPaseo
