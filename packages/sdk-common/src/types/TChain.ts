import type {
  CHAINS,
  EXTERNAL_CHAINS,
  PARACHAINS,
  RELAYCHAINS,
  SUBSTRATE_CHAINS
} from '../constants'

export type TParachain = (typeof PARACHAINS)[number]
export type TRelaychain = (typeof RELAYCHAINS)[number]
export type TSubstrateChain = (typeof SUBSTRATE_CHAINS)[number]
export type TExternalChain = (typeof EXTERNAL_CHAINS)[number]
export type TChain = (typeof CHAINS)[number]
