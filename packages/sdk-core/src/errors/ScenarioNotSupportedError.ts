import type { TChain } from '@paraspell/sdk-common'

import { type TScenario } from '../types'

/**
 * Used to inform user, that Parachain they wish to use does not support scenario they wish to use yet
 */
export class ScenarioNotSupportedError extends Error {
  /**
   * Constructs a new ScenarioNotSupportedError.
   *
   * @param chain - The chain where the scenario is not supported.
   * @param scenario - The scenario that is not supported.
   * @param message - Optional custom error message.
   */
  constructor(chain: TChain, scenario: TScenario, message?: string) {
    super(message ?? `Scenario ${scenario} not supported for chain ${chain}`)
    this.name = 'ScenarioNotSupported'
  }
}
