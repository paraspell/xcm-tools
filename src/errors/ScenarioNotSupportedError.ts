// Used to inform user, that Parachain they wish to use does not support scenario they wish to use yet

import { TNode, TScenario } from '../types'

export class ScenarioNotSupportedError extends Error {
  constructor(node: TNode, scenario: TScenario) {
    super(`Scenario ${scenario} not supported for node ${node}`)
    this.name = 'ScenarioNotSupported'
  }
}
