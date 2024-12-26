import type { TScenario } from '../types'

export const getFees = (scenario: TScenario): number => {
  if (scenario === 'ParaToRelay') {
    return 4600000000
  } else if (scenario === 'ParaToPara') {
    return 399600000000
  }
  throw new Error(`Fees for scenario ${scenario} are not defined.`)
}
