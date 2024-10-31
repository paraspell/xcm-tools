// Contains supported Parachains and exports supported XCM Pallets

import Acala from '../nodes/supported/Acala'
import Unique from '../nodes/supported/Unique'
import Crust from '../nodes/supported/Crust'
import { BifrostPolkadot } from '../nodes/supported/BifrostPolkadot'
import Bitgreen from '../nodes/supported/Bitgreen'
import { Centrifuge } from '../nodes/supported/Centrifuge'
import ComposableFinance from '../nodes/supported/ComposableFinance'
import Hydration from '../nodes/supported/Hydration'
import Interlay from '../nodes/supported/Interlay'
import Litentry from '../nodes/supported/Litentry'
import Moonbeam from '../nodes/supported/Moonbeam'
import Parallel from '../nodes/supported/Parallel'
import Altair from '../nodes/supported/Altair'
import Amplitude from '../nodes/supported/Amplitude'
import Bajun from '../nodes/supported/Bajun'
import Basilisk from '../nodes/supported/Basilisk'
import BifrostKusama from '../nodes/supported/BifrostKusama'
import Pioneer from '../nodes/supported/Pioneer'
import Turing from '../nodes/supported/Turing'
import Picasso from '../nodes/supported/Picasso'
import ParallelHeiko from '../nodes/supported/ParallelHeiko'
import Moonriver from '../nodes/supported/Moonriver'
import Kintsugi from '../nodes/supported/Kintsugi'
import Calamari from '../nodes/supported/Calamari'
import CrustShadow from '../nodes/supported/CrustShadow'
import Imbue from '../nodes/supported/Imbue'
import Integritee from '../nodes/supported/Integritee'
import InvArchTinker from '../nodes/supported/InvArchTinker'
import Karura from '../nodes/supported/Karura'
import AssetHubPolkadot from '../nodes/supported/AssetHubPolkadot'
import AssetHubKusama from '../nodes/supported/AssetHubKusama'
import CoretimeKusama from '../nodes/supported/CoretimeKusama'
import CoretimePolkadot from '../nodes/supported/CoretimePolkadot'
import Encointer from '../nodes/supported/Encointer'
import RobonomicsKusama from '../nodes/supported/RobonomicsKusama'
import RobonomicsPolkadot from '../nodes/supported/RobonomicsPolkadot'
import PeoplePolkadot from '../nodes/supported/PeoplePolkadot'
import PeopleKusama from '../nodes/supported/PeopleKusama'
import Astar from '../nodes/supported/Astar'
import Darwinia from '../nodes/supported/Darwinia'
import Crab from '../nodes/supported/Crab'
import Quartz from '../nodes/supported/Quartz'
import Shiden from '../nodes/supported/Shiden'
import Manta from '../nodes/supported/Manta'
import Nodle from '../nodes/supported/Nodle'
import NeuroWeb from '../nodes/supported/NeuroWeb'
import Pendulum from '../nodes/supported/Pendulum'
import Polkadex from '../nodes/supported/Polkadex'
import Zeitgeist from '../nodes/supported/Zeitgeist'
import Collectives from '../nodes/supported/Collectives'
import Khala from '../nodes/supported/Khala'
import Phala from '../nodes/supported/Phala'
import Subsocial from '../nodes/supported/Subsocial'
import KiltSpiritnet from '../nodes/supported/KiltSpiritnet'
import Curio from '../nodes/supported/Curio'
import BridgeHubPolkadot from '../nodes/supported/BridgeHubPolkadot'
import BridgeHubKusama from '../nodes/supported/BridgeHubKusama'
import Ethereum from '../nodes/supported/Ethereum'
import Mythos from '../nodes/supported/Mythos'
import Peaq from '../nodes/supported/Peaq'
import Polimec from '../nodes/supported/Polimec'

/**
 * Supported nodes excluding relay chains and Ethereum.
 */
export const NODE_NAMES_DOT_KSM = [
  'AssetHubPolkadot',
  'Acala',
  'Astar',
  'BifrostPolkadot',
  'Bitgreen',
  'BridgeHubPolkadot',
  'BridgeHubKusama',
  'Centrifuge',
  'ComposableFinance',
  'Darwinia',
  'Hydration',
  'Interlay',
  'Litentry',
  'Moonbeam',
  'Parallel',
  'AssetHubKusama',
  'CoretimeKusama',
  'CoretimePolkadot',
  'Encointer',
  'Altair',
  'Amplitude',
  'Bajun',
  'Basilisk',
  'BifrostKusama',
  'Pioneer',
  'Calamari',
  'CrustShadow',
  'Crab',
  'Imbue',
  'Integritee',
  'InvArchTinker',
  'Karura',
  'Kintsugi',
  'Moonriver',
  'ParallelHeiko',
  'Picasso',
  'Quartz',
  'RobonomicsKusama',
  'RobonomicsPolkadot',
  'PeoplePolkadot',
  'PeopleKusama',
  'Shiden',
  'Turing',
  'Unique',
  'Crust',
  'Manta',
  'Nodle',
  'NeuroWeb',
  'Pendulum',
  'Polkadex',
  'Zeitgeist',
  'Collectives',
  'Khala',
  'Phala',
  'Subsocial',
  'KiltSpiritnet',
  'Curio',
  'Mythos',
  'Peaq',
  'Polimec'
] as const

/**
 * Supported nodes including Ethereum.
 */
export const NODE_NAMES = [...NODE_NAMES_DOT_KSM, 'Ethereum'] as const

/**
 * Supported nodes including relay chains and Ethereum.
 */
export const NODES_WITH_RELAY_CHAINS = [...NODE_NAMES, 'Polkadot', 'Kusama'] as const

/**
 * Supported nodes including relay chains and excluding Ethereum.
 */
export const NODES_WITH_RELAY_CHAINS_DOT_KSM = [
  ...NODE_NAMES_DOT_KSM,
  'Polkadot',
  'Kusama'
] as const

export const nodes = <TApi, TRes>() => ({
  AssetHubPolkadot: new AssetHubPolkadot<TApi, TRes>(),
  Acala: new Acala<TApi, TRes>(),
  Astar: new Astar<TApi, TRes>(),
  Unique: new Unique<TApi, TRes>(),
  Crust: new Crust<TApi, TRes>(),
  BifrostPolkadot: new BifrostPolkadot<TApi, TRes>(),
  BridgeHubPolkadot: new BridgeHubPolkadot<TApi, TRes>(),
  BridgeHubKusama: new BridgeHubKusama<TApi, TRes>(),
  Bitgreen: new Bitgreen<TApi, TRes>(),
  Centrifuge: new Centrifuge<TApi, TRes>(),
  ComposableFinance: new ComposableFinance<TApi, TRes>(),
  Darwinia: new Darwinia<TApi, TRes>(),
  Hydration: new Hydration<TApi, TRes>(),
  Interlay: new Interlay<TApi, TRes>(),
  Litentry: new Litentry<TApi, TRes>(),
  Moonbeam: new Moonbeam<TApi, TRes>(),
  Parallel: new Parallel<TApi, TRes>(),
  AssetHubKusama: new AssetHubKusama<TApi, TRes>(),
  CoretimeKusama: new CoretimeKusama<TApi, TRes>(),
  CoretimePolkadot: new CoretimePolkadot<TApi, TRes>(),
  Encointer: new Encointer<TApi, TRes>(),
  Altair: new Altair<TApi, TRes>(),
  Amplitude: new Amplitude<TApi, TRes>(),
  Bajun: new Bajun<TApi, TRes>(),
  Basilisk: new Basilisk<TApi, TRes>(),
  BifrostKusama: new BifrostKusama<TApi, TRes>(),
  Pioneer: new Pioneer<TApi, TRes>(),
  Calamari: new Calamari<TApi, TRes>(),
  CrustShadow: new CrustShadow<TApi, TRes>(),
  Crab: new Crab<TApi, TRes>(),
  Imbue: new Imbue<TApi, TRes>(),
  Integritee: new Integritee<TApi, TRes>(),
  InvArchTinker: new InvArchTinker<TApi, TRes>(),
  Karura: new Karura<TApi, TRes>(),
  Kintsugi: new Kintsugi<TApi, TRes>(),
  Moonriver: new Moonriver<TApi, TRes>(),
  ParallelHeiko: new ParallelHeiko<TApi, TRes>(),
  Picasso: new Picasso<TApi, TRes>(),
  Quartz: new Quartz<TApi, TRes>(),
  RobonomicsKusama: new RobonomicsKusama<TApi, TRes>(),
  RobonomicsPolkadot: new RobonomicsPolkadot<TApi, TRes>(),
  PeoplePolkadot: new PeoplePolkadot<TApi, TRes>(),
  PeopleKusama: new PeopleKusama<TApi, TRes>(),
  Shiden: new Shiden<TApi, TRes>(),
  Turing: new Turing<TApi, TRes>(),
  Manta: new Manta<TApi, TRes>(),
  Nodle: new Nodle<TApi, TRes>(),
  NeuroWeb: new NeuroWeb<TApi, TRes>(),
  Pendulum: new Pendulum<TApi, TRes>(),
  Polkadex: new Polkadex<TApi, TRes>(),
  Zeitgeist: new Zeitgeist<TApi, TRes>(),
  Collectives: new Collectives<TApi, TRes>(),
  Khala: new Khala<TApi, TRes>(),
  Phala: new Phala<TApi, TRes>(),
  Subsocial: new Subsocial<TApi, TRes>(),
  KiltSpiritnet: new KiltSpiritnet<TApi, TRes>(),
  Curio: new Curio<TApi, TRes>(),
  Ethereum: new Ethereum<TApi, TRes>(),
  Mythos: new Mythos<TApi, TRes>(),
  Peaq: new Peaq<TApi, TRes>(),
  Polimec: new Polimec<TApi, TRes>()
})

/**
 * Supported XCM pallets.
 */
export const SUPPORTED_PALLETS = [
  'XTokens',
  'OrmlXTokens',
  'PolkadotXcm',
  'RelayerXcm',
  'XTransfer',
  'XcmPallet'
] as const
