//Contains supported Parachains and exports supported XCM Pallets

import Acala from '../nodes/supported/Acala'
import ParachainNode from '../nodes/ParachainNode'
import Unique from '../nodes/supported/Unique'
import { TNode } from '../types'
import Crust from '../nodes/supported/Crust'
import Efinity from '../nodes/supported/Efinity'
import { BifrostPolkadot } from '../nodes/supported/BifrostPolkadot'
import Bitgreen from '../nodes/supported/Bitgreen'
import { Centrifuge } from '../nodes/supported/Centrifuge'
import Clover from '../nodes/supported/Clover'
import ComposableFinance from '../nodes/supported/ComposableFinance'
import HydraDX from '../nodes/supported/HydraDX'
import Interlay from '../nodes/supported/Interlay'
import Kylin from '../nodes/supported/Kylin'
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
import Pichiu from '../nodes/supported/Pichiu'
import Picasso from '../nodes/supported/Picasso'
import ParallelHeiko from '../nodes/supported/ParallelHeiko'
import Moonriver from '../nodes/supported/Moonriver'
import Mangata from '../nodes/supported/Mangata'
import Litmus from '../nodes/supported/Litmus'
import Kintsugi from '../nodes/supported/Kintsugi'
import Kico from '../nodes/supported/Kico'
import Calamari from '../nodes/supported/Calamari'
import CrustShadow from '../nodes/supported/CrustShadow'
import Dorafactory from '../nodes/supported/Dorafactory'
import Imbue from '../nodes/supported/Imbue'
import Integritee from '../nodes/supported/Integritee'
import InvArchTinker from '../nodes/supported/InvArchTinker'
import Karura from '../nodes/supported/Karura'
import Statemint from '../nodes/supported/Statemint'
import Statemine from '../nodes/supported/Statemine'
import Encointer from '../nodes/supported/Encointer'
import Robonomics from '../nodes/supported/Robonomics'
import Astar from '../nodes/supported/Astar'
import Equilibrium from '../nodes/supported/Equilibrium'
import Darwinia from '../nodes/supported/Darwinia'
import Crab from '../nodes/supported/Crab'
import Ipci from '../nodes/supported/Ipci'
import Quartz from '../nodes/supported/Quartz'
import Shiden from '../nodes/supported/Shiden'

export const NODE_NAMES = [
  'Statemint',
  'Acala',
  'Astar',
  'BifrostPolkadot',
  'Bitgreen',
  'Centrifuge',
  'Clover',
  'ComposableFinance',
  'Darwinia',
  'HydraDX',
  'Interlay',
  'Kylin',
  'Litentry',
  'Moonbeam',
  'Parallel',
  'Statemine',
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
  'Dorafactory',
  'Imbue',
  'Integritee',
  'InvArchTinker',
  'Karura',
  'Kico',
  'Kintsugi',
  'Litmus',
  'Mangata',
  'Moonriver',
  'ParallelHeiko',
  'Picasso',
  'Pichiu',
  'Quartz',
  'Robonomics',
  'Shiden',
  'Turing',
  'Equilibrium',
  'Unique',
  'Crust',
  'Efinity',
  'Ipci'
] as const

export const nodes: Record<TNode, ParachainNode> = {
  Statemint: new Statemint(),
  Acala: new Acala(),
  Astar: new Astar(),
  Equilibrium: new Equilibrium(),
  Unique: new Unique(),
  Crust: new Crust(),
  Efinity: new Efinity(),
  BifrostPolkadot: new BifrostPolkadot(),
  Bitgreen: new Bitgreen(),
  Centrifuge: new Centrifuge(),
  Clover: new Clover(),
  ComposableFinance: new ComposableFinance(),
  Darwinia: new Darwinia(),
  HydraDX: new HydraDX(),
  Interlay: new Interlay(),
  Kylin: new Kylin(),
  Litentry: new Litentry(),
  Moonbeam: new Moonbeam(),
  Parallel: new Parallel(),
  Statemine: new Statemine(),
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
  Dorafactory: new Dorafactory(),
  Imbue: new Imbue(),
  Integritee: new Integritee(),
  InvArchTinker: new InvArchTinker(),
  Karura: new Karura(),
  Kico: new Kico(),
  Kintsugi: new Kintsugi(),
  Ipci: new Ipci(),
  Litmus: new Litmus(),
  Mangata: new Mangata(),
  Moonriver: new Moonriver(),
  ParallelHeiko: new ParallelHeiko(),
  Picasso: new Picasso(),
  Pichiu: new Pichiu(),
  Quartz: new Quartz(),
  Robonomics: new Robonomics(),
  Shiden: new Shiden(),
  Turing: new Turing()
}

export const SUPPORTED_PALLETS = ['XTokens', 'OrmlXTokens', 'PolkadotXcm', 'RelayerXcm'] as const
