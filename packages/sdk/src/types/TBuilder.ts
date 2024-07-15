import { Signer } from 'ethers'
import { TNodePolkadotKusama } from './TNode'

export type TEvmBuilderOptions = {
  to: TNodePolkadotKusama
  amount: string
  currency: string
  address: string
  signer: Signer
}

type OptionalProperties<T> = {
  [P in keyof T]?: T[P] | undefined
}

export type TOptionalEvmBuilderOptions = OptionalProperties<TEvmBuilderOptions>
