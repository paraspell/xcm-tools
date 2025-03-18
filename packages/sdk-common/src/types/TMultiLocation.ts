export enum Parents {
  ZERO = 0,
  ONE = 1,
  TWO = 2
}

export type TJunctionType =
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

type TNetworkId = string | null
type TBodyId = string | null
type TBodyPart = string | null
type TStringOrNumber = string | number
type TStringOrNumberOrBigInt = TStringOrNumber | bigint
type THexString = string

export type TJunctionParachain = {
  Parachain: TStringOrNumberOrBigInt | undefined
}

type TJunctionAccountId32 = {
  AccountId32: {
    network?: TNetworkId
    id: THexString
  }
}

type TJunctionAccountIndex64 = {
  AccountIndex64: {
    network: TNetworkId
    index: TStringOrNumberOrBigInt
  }
}

type TJunctionAccountKey20 = {
  AccountKey20: {
    network?: TNetworkId
    key: THexString
  }
}

type TJunctionPalletInstance = {
  PalletInstance: TStringOrNumberOrBigInt
}

export type TJunctionGeneralIndex = {
  GeneralIndex: TStringOrNumberOrBigInt
}

type TJunctionGeneralKey = {
  GeneralKey: {
    length: TStringOrNumberOrBigInt
    data: THexString
  }
}

type TJunctionOnlyChild = {
  OnlyChild: string
}

type TJunctionPlurality = {
  Plurality: {
    id: TBodyId
    part: TBodyPart
  }
}

type TJunctionGlobalConsensus = {
  GlobalConsensus: TNetworkId | object
}

export type TJunction =
  | TJunctionParachain
  | TJunctionAccountId32
  | TJunctionAccountIndex64
  | TJunctionAccountKey20
  | TJunctionPalletInstance
  | TJunctionGeneralIndex
  | TJunctionGeneralKey
  | TJunctionOnlyChild
  | TJunctionPlurality
  | TJunctionGlobalConsensus

export interface TJunctions {
  Here?: null
  X1?: TJunction | TJunction[]
  X2?: TJunction[]
  X3?: TJunction[]
  X4?: TJunction[]
  X5?: TJunction[]
  X6?: TJunction[]
  X7?: TJunction[]
  X8?: TJunction[]
}

export interface TMultiLocation {
  parents: TStringOrNumber
  interior: TJunctions | 'Here'
}
