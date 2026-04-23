import type { PolkadotApi, TApiOrUrl, TBuilderOptions, TSubstrateChain } from '@paraspell/sdk-core'
import { createChainClient as createChainClientInternal } from '@paraspell/sdk-core'
import type { Contract, Signer } from 'ethers'
import type { Abi, GetContractReturnType, WalletClient } from 'viem'

import PolkadotJsApi from '../PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsSigner } from '../types'

export const createChainClient = (
  chain: TSubstrateChain,
  builderOptions?: TBuilderOptions<TApiOrUrl<TPjsApi>>
) => {
  const pjsApi = new PolkadotJsApi(builderOptions)
  return createChainClientInternal<TPjsApi, Extrinsic, TPjsSigner>(pjsApi, chain)
}

export const createPolkadotJsApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (
    options: TArgs & { api: PolkadotApi<TPjsApi, Extrinsic, TPjsSigner> }
  ) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: TApiOrUrl<TPjsApi> }): Promise<TResult> => {
    const pjsApi = new PolkadotJsApi(options.api)

    const optionsWithApi = {
      ...options,
      api: pjsApi
    } as TArgs & { api: PolkadotApi<TPjsApi, Extrinsic, TPjsSigner> }

    return apiCall(optionsWithApi)
  }
}

export const isEthersSigner = (signer: Signer | WalletClient): signer is Signer =>
  typeof signer === 'object' && signer !== null && 'provider' in signer

export const isEthersContract = (
  contract: Contract | GetContractReturnType<Abi | readonly unknown[]>
): contract is Contract => !('abi' in contract)
