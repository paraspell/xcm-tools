// Contains detailed structure of XCM call construction for the EnergyWebXPaseo Parachain

import { Version } from '@paraspell/sdk-common'

import EnergyWebX from './EnergyWebX'

class EnergyWebXPaseo<TApi, TRes, TSigner> extends EnergyWebX<TApi, TRes, TSigner> {
  constructor() {
    super('EnergyWebXPaseo', 'paseoEwx', 'Paseo', Version.V3)
  }
}

export default EnergyWebXPaseo
