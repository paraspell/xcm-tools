import type { TChain } from '@paraspell/sdk-common'

import { type TScenario } from '../types'

type TScenarioNotSupportedContext = {
  chain: TChain
  scenario: TScenario
}

/**
 * Error thrown when a scenario, route, or chain capability is not supported.
 */
export class ScenarioNotSupportedError extends Error {
  constructor(message: string)
  constructor({ chain, scenario }: TScenarioNotSupportedContext)
  constructor(contextOrMsg: string | TScenarioNotSupportedContext) {
    if (typeof contextOrMsg === 'string') {
      super(contextOrMsg)
      this.name = 'ScenarioNotSupportedError'
      return
    }

    const { chain, scenario } = contextOrMsg
    const parts = [`Scenario ${scenario}`, `for chain ${chain}`, 'is not supported']

    super(parts.join(' '))
    this.name = 'ScenarioNotSupportedError'
  }
}
