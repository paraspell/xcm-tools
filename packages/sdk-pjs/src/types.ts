import type {
  TApiOrUrl,
  TCurrencyInputWithAmount,
  TEvmNodeFrom,
  TNodeWithRelayChains,
  WithApi
} from '@paraspell/sdk-core'
import type { ApiPromise } from '@polkadot/api'
import { type SubmittableExtrinsic } from '@polkadot/api/types'
import type { AbstractProvider, Signer } from 'ethers'
import type { WalletClient } from 'viem'

export type TPjsApi = ApiPromise
export type TPjsApiOrUrl = TApiOrUrl<TPjsApi>

export type Extrinsic = SubmittableExtrinsic<'promise'>

type TEvmBuilderOptionsBase = {
  /**
   * The source node. Can be either 'Ethereum', 'Moonbeam', 'Moonriver', or 'Darwinia'.
   */
  from: TEvmNodeFrom
  /**
   * The destination node on Polkadot network.
   */
  to: TNodeWithRelayChains
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

export type TPjsEvmBuilderOptions<TApi, TRes> = WithApi<TEvmBuilderOptionsBase, TApi, TRes> & {
  provider?: AbstractProvider
}
