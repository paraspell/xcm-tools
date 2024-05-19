// Contains supported Parachains and exports supported XCM Pallets

import Acala from '../nodes/supported/Acala'
import type ParachainNode from '../nodes/ParachainNode'
import Unique from '../nodes/supported/Unique'
import { type TNode } from '../types'
import Crust from '../nodes/supported/Crust'
import { BifrostPolkadot } from '../nodes/supported/BifrostPolkadot'
import Bitgreen from '../nodes/supported/Bitgreen'
import { Centrifuge } from '../nodes/supported/Centrifuge'
import ComposableFinance from '../nodes/supported/ComposableFinance'
import HydraDX from '../nodes/supported/HydraDX'
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
import Mangata from '../nodes/supported/Mangata'
import Litmus from '../nodes/supported/Litmus'
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
import Encointer from '../nodes/supported/Encointer'
import Robonomics from '../nodes/supported/Robonomics'
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

export const NODE_NAMES = [
  'AssetHubPolkadot',
  'Acala',
  'Astar',
  'BifrostPolkadot',
  'Bitgreen',
  'Centrifuge',
  'ComposableFinance',
  'Darwinia',
  'HydraDX',
  'Interlay',
  'Litentry',
  'Moonbeam',
  'Parallel',
  'AssetHubKusama',
  'CoretimeKusama',
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
  'Litmus',
  'Mangata',
  'Moonriver',
  'ParallelHeiko',
  'Picasso',
  'Quartz',
  'Robonomics',
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
  'Curio'
] as const

export const NODES_WITH_RELAY_CHAINS = [...NODE_NAMES, 'Polkadot', 'Kusama'] as const

export const nodes: Record<TNode, ParachainNode> = {
  AssetHubPolkadot: new AssetHubPolkadot(),
  Acala: new Acala(),
  Astar: new Astar(),
  Unique: new Unique(),
  Crust: new Crust(),
  BifrostPolkadot: new BifrostPolkadot(),
  Bitgreen: new Bitgreen(),
  Centrifuge: new Centrifuge(),
  ComposableFinance: new ComposableFinance(),
  Darwinia: new Darwinia(),
  HydraDX: new HydraDX(),
  Interlay: new Interlay(),
  Litentry: new Litentry(),
  Moonbeam: new Moonbeam(),
  Parallel: new Parallel(),
  AssetHubKusama: new AssetHubKusama(),
  CoretimeKusama: new CoretimeKusama(),
  Encointer: new Encointer(),
  Altair: new Altair(),
  Amplitude: new Amplitude(),
  Bajun: new Bajun(),
  Basilisk: new Basilisk(),
  BifrostKusama: new BifrostKusama(),
  Pioneer: new Pioneer(),
  Calamari: new Calamari(),
  CrustShadow: new CrustShadow(),
  Crab: new Crab(),
  Imbue: new Imbue(),
  Integritee: new Integritee(),
  InvArchTinker: new InvArchTinker(),
  Karura: new Karura(),
  Kintsugi: new Kintsugi(),
  Litmus: new Litmus(),
  Mangata: new Mangata(),
  Moonriver: new Moonriver(),
  ParallelHeiko: new ParallelHeiko(),
  Picasso: new Picasso(),
  Quartz: new Quartz(),
  Robonomics: new Robonomics(),
  Shiden: new Shiden(),
  Turing: new Turing(),
  Manta: new Manta(),
  Nodle: new Nodle(),
  NeuroWeb: new NeuroWeb(),
  Pendulum: new Pendulum(),
  Polkadex: new Polkadex(),
  Zeitgeist: new Zeitgeist(),
  Collectives: new Collectives(),
  Khala: new Khala(),
  Phala: new Phala(),
  Subsocial: new Subsocial(),
  KiltSpiritnet: new KiltSpiritnet(),
  Curio: new Curio()
}

export const SUPPORTED_PALLETS = [
  'XTokens',
  'OrmlXTokens',
  'PolkadotXcm',
  'RelayerXcm',
  'XTransfer'
] as const
