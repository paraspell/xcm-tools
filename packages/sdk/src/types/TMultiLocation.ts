export type JunctionType =
  | 'Parachain'
  | 'AccountId32'
  | 'AccountIndex64'
  | 'AccountKey20'
  | 'PalletInstance'
  | 'GeneralIndex'
  | 'GeneralKey'
  | 'OnlyChild'
  | 'Plurality'
  | 'GlobalConsensus'

type NetworkId = string | null
type BodyId = string | null
type BodyPart = string | null
type StringOrNumber = string | number
type HexString = string

interface JunctionParachain {
  Parachain: StringOrNumber
}

interface JunctionAccountId32 {
  AccountId32: {
    network: NetworkId
    id: HexString
  }
}

interface JunctionAccountIndex64 {
  AccountIndex64: {
    network: NetworkId
    index: StringOrNumber
  }
}

interface JunctionAccountKey20 {
  AccountKey20: {
    network: NetworkId
    key: HexString
  }
}

interface JunctionPalletInstance {
  PalletInstance: StringOrNumber
}

interface JunctionGeneralIndex {
  GeneralIndex: StringOrNumber
}

interface JunctionGeneralKey {
  GeneralKey: {
    length: StringOrNumber
    data: HexString
  }
}

interface JunctionOnlyChild {
  OnlyChild: string
}

interface JunctionPlurality {
  Plurality: {
    id: BodyId
    part: BodyPart
  }
}

interface JunctionGlobalConsensus {
  GlobalConsensus: NetworkId
}

type Junction =
  | JunctionParachain
  | JunctionAccountId32
  | JunctionAccountIndex64
  | JunctionAccountKey20
  | JunctionPalletInstance
  | JunctionGeneralIndex
  | JunctionGeneralKey
  | JunctionOnlyChild
  | JunctionPlurality
  | JunctionGlobalConsensus

interface Junctions {
  X1?: Junction
  X2?: [Junction, Junction]
  X3?: [Junction, Junction, Junction]
  X4?: [Junction, Junction, Junction, Junction]
  X5?: [Junction, Junction, Junction, Junction, Junction]
  X6?: [Junction, Junction, Junction, Junction, Junction, Junction]
  X7?: [Junction, Junction, Junction, Junction, Junction, Junction, Junction]
  X8?: [Junction, Junction, Junction, Junction, Junction, Junction, Junction, Junction]
  X9?: [Junction, Junction, Junction, Junction, Junction, Junction, Junction, Junction, Junction]
  X10?: [
    Junction,
    Junction,
    Junction,
    Junction,
    Junction,
    Junction,
    Junction,
    Junction,
    Junction,
    Junction
  ]
}

export interface TMultiLocation {
  parents: StringOrNumber
  interior: Junctions
}
