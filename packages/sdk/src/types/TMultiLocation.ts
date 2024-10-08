import { type Version } from './TTransfer'

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
type StringOrNumberOrBigInt = StringOrNumber | bigint
type HexString = string

export interface JunctionParachain {
  Parachain: StringOrNumberOrBigInt | undefined
}

interface JunctionAccountId32 {
  AccountId32: {
    network?: NetworkId
    id: HexString
  }
}

interface JunctionAccountIndex64 {
  AccountIndex64: {
    network: NetworkId
    index: StringOrNumberOrBigInt
  }
}

interface JunctionAccountKey20 {
  AccountKey20: {
    network?: NetworkId
    key: HexString
  }
}

interface JunctionPalletInstance {
  PalletInstance: StringOrNumberOrBigInt
}

interface JunctionGeneralIndex {
  GeneralIndex: StringOrNumberOrBigInt
}

interface JunctionGeneralKey {
  GeneralKey: {
    length: StringOrNumberOrBigInt
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
  GlobalConsensus: NetworkId | object
}

export type TJunction =
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

export interface Junctions {
  Here?: null
  X1?: TJunction | [TJunction]
  X2?: [TJunction, TJunction]
  X3?: [TJunction, TJunction, TJunction]
  X4?: [TJunction, TJunction, TJunction, TJunction]
  X5?: [TJunction, TJunction, TJunction, TJunction, TJunction]
  X6?: [TJunction, TJunction, TJunction, TJunction, TJunction, TJunction]
  X7?: [TJunction, TJunction, TJunction, TJunction, TJunction, TJunction, TJunction]
  X8?: [TJunction, TJunction, TJunction, TJunction, TJunction, TJunction, TJunction, TJunction]
  X9?: [
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction
  ]
  X10?: [
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction,
    TJunction
  ]
}

export interface TMultiLocation {
  parents: StringOrNumber
  interior: Junctions | 'Here'
}

export type TMultiLocationHeader = {
  [key in Version]?: TMultiLocation
}
