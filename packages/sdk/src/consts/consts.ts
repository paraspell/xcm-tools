import type { TChain } from '@paraspell/sdk-core'

export const LEGACY_CHAINS: TChain[] = [
  'ComposableFinance',
  'Interlay',
  'CrustShadow',
  'Kintsugi',
  'RobonomicsKusama',
  'Pendulum',
  'Subsocial'
]

// Cache settings
export const DEFAULT_TTL_MS = 60_000 // 1 minute
export const MAX_CLIENTS = 100
export const EXTENSION_MS = 5 * 60_000 // 5 minutes
