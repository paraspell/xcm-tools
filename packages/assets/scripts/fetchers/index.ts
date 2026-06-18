import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { TAssetsFetcher } from '../types'
import { fetchAcalaAssets, fetchAcalaNativeAssets } from './acala'
import { fetchAjunaAssets } from './ajuna'
import { fetchAssetHubAssets } from './assethub'
import { fetchAstarAssets } from './astar'
import { fetchBasiliskAssets } from './basilisk'
import { fetchBifrostAssets, fetchBifrostNativeAssets } from './bifrost'
import { fetchCentrifugeAssets, fetchCentrifugeNativeAssets } from './centrifuge'
import { fetchDarwiniaAssets } from './darwinia'
import { fetchEnergyWebXAssets } from './energyWebX'
import { fetchHydrationAssets } from './hydration'
import { fetchInterlayAssets } from './interlay'
import { fetchMoonbeamAssets } from './moonbeam'
import { fetchPendulumAssets } from './pendulum'
import { fetchPenpalAssets } from './penpal'
import { fetchUniqueAssets } from './unique'
import { fetchXodeAssets } from './xode'
import { fetchZeitgeistAssets, fetchZeitgeistNativeAssets } from './zeitgeist'

export const getOtherAssetsFetcher = (chain: TSubstrateChain): TAssetsFetcher | undefined => {
  if (chain.includes('AssetHub')) return fetchAssetHubAssets
  if (chain.startsWith('Zeitgeist') || chain === 'Jamton') return fetchZeitgeistAssets
  if (chain === 'Acala' || chain === 'Karura') return fetchAcalaAssets
  if (chain.startsWith('Bifrost')) return fetchBifrostAssets
  if (chain === 'Centrifuge') return fetchCentrifugeAssets
  if (chain === 'Pendulum') return fetchPendulumAssets
  if (chain === 'Moonbeam' || chain === 'Moonriver') return fetchMoonbeamAssets
  if (chain === 'Unique' || chain === 'Quartz') return fetchUniqueAssets
  if (chain === 'Penpal' || chain.startsWith('NeuroWeb')) return fetchPenpalAssets
  if (chain.startsWith('Ajuna') || chain.startsWith('Integritee') || chain === 'Peaq')
    return fetchAjunaAssets
  if (chain === 'Astar' || chain === 'Shiden') return fetchAstarAssets
  if (chain === 'Darwinia' || chain.startsWith('Crust')) return fetchDarwiniaAssets
  if (chain === 'Interlay' || chain === 'Kintsugi') return fetchInterlayAssets
  if (chain === 'Xode') return fetchXodeAssets
  if (chain.startsWith('Hydration')) return fetchHydrationAssets
  if (chain === 'Basilisk') return fetchBasiliskAssets
  if (chain.startsWith('EnergyWebX')) return fetchEnergyWebXAssets
  return undefined
}

export const getNativeAssetsFetcher = (
  chain: TSubstrateChain
): TAssetsFetcher | undefined => {
  if (chain.startsWith('Bifrost')) return fetchBifrostNativeAssets
  if (chain === 'Jamton') return fetchZeitgeistNativeAssets
  if (chain === 'Acala' || chain === 'Karura') return fetchAcalaNativeAssets
  if (chain === 'Centrifuge') return fetchCentrifugeNativeAssets
  return undefined
}
