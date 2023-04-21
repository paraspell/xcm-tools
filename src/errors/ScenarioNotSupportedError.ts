import { TNode, TScenario } from '../types'

export class ScenarioNotSupportedError extends Error {
  constructor(node: TNode, scenario: TScenario) {
    super(`Scenario ${scenario} not supported for node ${node}`)
    this.name = 'ScenarioNotSupported'
  }
}
