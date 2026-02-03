import type {
  TApiOrUrl,
  TChain,
  TCurrencyInputWithAmount,
  TEvmChainFrom,
  WithApi
} from '@paraspell/sdk-core'
import type { ApiPromise } from '@polkadot/api'
import type { Signer as PjsSigner } from '@polkadot/api/types'
import { type SubmittableExtrinsic } from '@polkadot/api/types'
import type { AbstractProvider, Signer } from 'ethers'
import type { WalletClient } from 'viem'

export type TPjsApi = ApiPromise
export type TPjsApiOrUrl = TApiOrUrl<TPjsApi>
export type Extrinsic = SubmittableExtrinsic<'promise'>
export type TPjsSigner = { signer: PjsSigner; address: string }

type TEvmBuilderOptionsBase = {
  /**
   * The source chain. Can be either 'Ethereum', 'Moonbeam', 'Moonriver', or 'Darwinia'.
   */
  from: TEvmChainFrom
  /**
   * The destination chain.
   */
  to: TChain
  /**
   * The currency to transfer. Symbol or ID.
   */
  currency: TCurrencyInputWithAmount
  /**
   * The Polkadot destination address.
   */
  address: string
  /**
   * The AssetHub address
   */
  ahAddress?: string
  /**
   * The Ethereum signer.
   */
  signer: Signer | WalletClient
}

export type TPjsEvmBuilderOptions<TApi, TRes, TSigner> = WithApi<
  TEvmBuilderOptionsBase,
  TApi,
  TRes,
  TSigner
> & {
  provider?: AbstractProvider
}
