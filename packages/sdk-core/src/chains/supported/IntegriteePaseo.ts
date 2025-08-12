// Contains detailed structure of XCM call construction for the IntegriteePaseo Parachain

import { Version } from '@paraspell/sdk-common'

import IntegriteeKusama from './IntegriteeKusama'

class IntegriteePaseo<TApi, TRes> extends IntegriteeKusama<TApi, TRes> {
  constructor() {
    super('IntegriteePaseo', 'integritee', 'Paseo', Version.V4)
  }
}

export default IntegriteePaseo
