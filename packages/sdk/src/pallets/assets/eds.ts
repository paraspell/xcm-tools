import type { TEdJsonMap, TNodeDotKsmWithRelayChains } from '../../types'
import * as edMapJson from '../../maps/existential-deposits.json' assert { type: 'json' }

const edMap = edMapJson as TEdJsonMap

export const getExistentialDeposit = (node: TNodeDotKsmWithRelayChains): string | null =>
  edMap[node]
