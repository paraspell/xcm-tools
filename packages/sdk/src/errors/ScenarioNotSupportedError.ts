import { type TNode, type TScenario } from '../types'

/**
 * Used to inform user, that Parachain they wish to use does not support scenario they wish to use yet
 */
export class ScenarioNotSupportedError extends Error {
  /**
   * Constructs a new ScenarioNotSupportedError.
   *
   * @param node - The node where the scenario is not supported.
   * @param scenario - The scenario that is not supported.
   * @param message - Optional custom error message.
   */
  constructor(node: TNode, scenario: TScenario, message?: string) {
    super(message ?? `Scenario ${scenario} not supported for node ${node}`)
    this.name = 'ScenarioNotSupported'
  }
}
