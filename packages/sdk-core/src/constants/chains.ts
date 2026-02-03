import Acala from '../chains/supported/Acala'
import Ajuna from '../chains/supported/Ajuna'
import AjunaPaseo from '../chains/supported/AjunaPaseo'
import Altair from '../chains/supported/Altair'
import AssetHubKusama from '../chains/supported/AssetHubKusama'
import AssetHubPaseo from '../chains/supported/AssetHubPaseo'
import AssetHubPolkadot from '../chains/supported/AssetHubPolkadot'
import AssetHubWestend from '../chains/supported/AssetHubWestend'
import Astar from '../chains/supported/Astar'
import Basilisk from '../chains/supported/Basilisk'
import BifrostKusama from '../chains/supported/BifrostKusama'
import BifrostPaseo from '../chains/supported/BifrostPaseo'
import BifrostPolkadot from '../chains/supported/BifrostPolkadot'
import BridgeHubKusama from '../chains/supported/BridgeHubKusama'
import BridgeHubPaseo from '../chains/supported/BridgeHubPaseo'
import BridgeHubPolkadot from '../chains/supported/BridgeHubPolkadot'
import BridgeHubWestend from '../chains/supported/BridgeHubWestend'
import Centrifuge from '../chains/supported/Centrifuge'
import Collectives from '../chains/supported/Collectives'
import CollectivesWestend from '../chains/supported/CollectivesWestend'
import CoretimeKusama from '../chains/supported/CoretimeKusama'
import CoretimePaseo from '../chains/supported/CoretimePaseo'
import CoretimePolkadot from '../chains/supported/CoretimePolkadot'
import CoretimeWestend from '../chains/supported/CoretimeWestend'
import Crab from '../chains/supported/Crab'
import Crust from '../chains/supported/Crust'
import CrustShadow from '../chains/supported/CrustShadow'
import Curio from '../chains/supported/Curio'
import Darwinia from '../chains/supported/Darwinia'
import Encointer from '../chains/supported/Encointer'
import EnergyWebX from '../chains/supported/EnergyWebX'
import EnergyWebXPaseo from '../chains/supported/EnergyWebXPaseo'
import Heima from '../chains/supported/Heima'
import HeimaPaseo from '../chains/supported/HeimaPaseo'
import Hydration from '../chains/supported/Hydration'
import HydrationPaseo from '../chains/supported/HydrationPaseo'
import Interlay from '../chains/supported/Interlay'
import Jamton from '../chains/supported/Jamton'
import Karura from '../chains/supported/Karura'
import KiltPaseo from '../chains/supported/KiltPaseo'
import KiltSpiritnet from '../chains/supported/KiltSpiritnet'
import Kintsugi from '../chains/supported/Kintsugi'
import Kusama from '../chains/supported/Kusama'
import Laos from '../chains/supported/Laos'
import LaosPaseo from '../chains/supported/LaosPaseo'
import Manta from '../chains/supported/Manta'
import Moonbeam from '../chains/supported/Moonbeam'
import Moonriver from '../chains/supported/Moonriver'
import Mythos from '../chains/supported/Mythos'
import NeuroWeb from '../chains/supported/NeuroWeb'
import NeuroWebPaseo from '../chains/supported/NeuroWebPaseo'
import Nodle from '../chains/supported/Nodle'
import Paseo from '../chains/supported/Paseo'
import PAssetHub from '../chains/supported/PAssetHub'
import Peaq from '../chains/supported/Peaq'
import Pendulum from '../chains/supported/Pendulum'
import Penpal from '../chains/supported/Penpal'
import PeopleKusama from '../chains/supported/PeopleKusama'
import PeoplePaseo from '../chains/supported/PeoplePaseo'
import PeoplePolkadot from '../chains/supported/PeoplePolkadot'
import PeopleWestend from '../chains/supported/PeopleWestend'
import Phala from '../chains/supported/Phala'
import Polkadot from '../chains/supported/Polkadot'
import Quartz from '../chains/supported/Quartz'
import RobonomicsPolkadot from '../chains/supported/RobonomicsPolkadot'
import Shiden from '../chains/supported/Shiden'
import Unique from '../chains/supported/Unique'
import Westend from '../chains/supported/Westend'
import Xode from '../chains/supported/Xode'
import Zeitgeist from '../chains/supported/Zeitgeist'
import ZeitgeistPaseo from '../chains/supported/ZeitgeistPaseo'

export const chains = <TApi, TRes, TSigner>() => ({
  // Polkadot chains
  Polkadot: new Polkadot<TApi, TRes, TSigner>(),
  AssetHubPolkadot: new AssetHubPolkadot<TApi, TRes, TSigner>(),
  Acala: new Acala<TApi, TRes, TSigner>(),
  Ajuna: new Ajuna<TApi, TRes, TSigner>(),
  Astar: new Astar<TApi, TRes, TSigner>(),
  Unique: new Unique<TApi, TRes, TSigner>(),
  Crust: new Crust<TApi, TRes, TSigner>(),
  BifrostPolkadot: new BifrostPolkadot<TApi, TRes, TSigner>(),
  BridgeHubPolkadot: new BridgeHubPolkadot<TApi, TRes, TSigner>(),
  Centrifuge: new Centrifuge<TApi, TRes, TSigner>(),
  Darwinia: new Darwinia<TApi, TRes, TSigner>(),
  EnergyWebX: new EnergyWebX<TApi, TRes, TSigner>(),
  Hydration: new Hydration<TApi, TRes, TSigner>(),
  Interlay: new Interlay<TApi, TRes, TSigner>(),
  Heima: new Heima<TApi, TRes, TSigner>(),
  Jamton: new Jamton<TApi, TRes, TSigner>(),
  Moonbeam: new Moonbeam<TApi, TRes, TSigner>(),
  CoretimePolkadot: new CoretimePolkadot<TApi, TRes, TSigner>(),
  RobonomicsPolkadot: new RobonomicsPolkadot<TApi, TRes, TSigner>(),
  PeoplePolkadot: new PeoplePolkadot<TApi, TRes, TSigner>(),
  Manta: new Manta<TApi, TRes, TSigner>(),
  Nodle: new Nodle<TApi, TRes, TSigner>(),
  NeuroWeb: new NeuroWeb<TApi, TRes, TSigner>(),
  Pendulum: new Pendulum<TApi, TRes, TSigner>(),
  Collectives: new Collectives<TApi, TRes, TSigner>(),
  Phala: new Phala<TApi, TRes, TSigner>(),
  KiltSpiritnet: new KiltSpiritnet<TApi, TRes, TSigner>(),
  Curio: new Curio<TApi, TRes, TSigner>(),
  Mythos: new Mythos<TApi, TRes, TSigner>(),
  Peaq: new Peaq<TApi, TRes, TSigner>(),
  Xode: new Xode<TApi, TRes, TSigner>(),

  // Kusama chains
  Kusama: new Kusama<TApi, TRes, TSigner>(),
  AssetHubKusama: new AssetHubKusama<TApi, TRes, TSigner>(),
  BridgeHubKusama: new BridgeHubKusama<TApi, TRes, TSigner>(),
  CoretimeKusama: new CoretimeKusama<TApi, TRes, TSigner>(),
  Encointer: new Encointer<TApi, TRes, TSigner>(),
  Altair: new Altair<TApi, TRes, TSigner>(),
  Basilisk: new Basilisk<TApi, TRes, TSigner>(),
  BifrostKusama: new BifrostKusama<TApi, TRes, TSigner>(),
  CrustShadow: new CrustShadow<TApi, TRes, TSigner>(),
  Crab: new Crab<TApi, TRes, TSigner>(),
  Karura: new Karura<TApi, TRes, TSigner>(),
  Kintsugi: new Kintsugi<TApi, TRes, TSigner>(),
  Moonriver: new Moonriver<TApi, TRes, TSigner>(),
  Laos: new Laos<TApi, TRes, TSigner>(),
  Quartz: new Quartz<TApi, TRes, TSigner>(),
  PeopleKusama: new PeopleKusama<TApi, TRes, TSigner>(),
  Shiden: new Shiden<TApi, TRes, TSigner>(),
  Zeitgeist: new Zeitgeist<TApi, TRes, TSigner>(),

  // Westend chains
  Westend: new Westend<TApi, TRes, TSigner>(),
  AssetHubWestend: new AssetHubWestend<TApi, TRes, TSigner>(),
  BridgeHubWestend: new BridgeHubWestend<TApi, TRes, TSigner>(),
  CollectivesWestend: new CollectivesWestend<TApi, TRes, TSigner>(),
  CoretimeWestend: new CoretimeWestend<TApi, TRes, TSigner>(),
  PeopleWestend: new PeopleWestend<TApi, TRes, TSigner>(),
  Penpal: new Penpal<TApi, TRes, TSigner>(),

  // Paseo chains
  Paseo: new Paseo<TApi, TRes, TSigner>(),
  AssetHubPaseo: new AssetHubPaseo<TApi, TRes, TSigner>(),
  BridgeHubPaseo: new BridgeHubPaseo<TApi, TRes, TSigner>(),
  CoretimePaseo: new CoretimePaseo<TApi, TRes, TSigner>(),
  EnergyWebXPaseo: new EnergyWebXPaseo<TApi, TRes, TSigner>(),
  KiltPaseo: new KiltPaseo<TApi, TRes, TSigner>(),
  PAssetHub: new PAssetHub<TApi, TRes, TSigner>(),
  PeoplePaseo: new PeoplePaseo<TApi, TRes, TSigner>(),
  AjunaPaseo: new AjunaPaseo<TApi, TRes, TSigner>(),
  BifrostPaseo: new BifrostPaseo<TApi, TRes, TSigner>(),
  HeimaPaseo: new HeimaPaseo<TApi, TRes, TSigner>(),
  HydrationPaseo: new HydrationPaseo<TApi, TRes, TSigner>(),
  LaosPaseo: new LaosPaseo<TApi, TRes, TSigner>(),
  NeuroWebPaseo: new NeuroWebPaseo<TApi, TRes, TSigner>(),
  ZeitgeistPaseo: new ZeitgeistPaseo<TApi, TRes, TSigner>()
})
