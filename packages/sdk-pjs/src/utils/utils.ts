import type { IPolkadotApi, TBuilderOptions, TSubstrateChain } from '@paraspell/sdk-core'
import { createChainClient as createChainClientInternal } from '@paraspell/sdk-core'
import type { Contract, Signer } from 'ethers'
import type { Abi, GetContractReturnType, WalletClient } from 'viem'

import PolkadotJsApi from '../PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl, TPjsSigner } from '../types'

export const createChainClient = (
  chain: TSubstrateChain,
  builderOptions?: TBuilderOptions<TPjsApiOrUrl>
) => {
  const pjsApi = new PolkadotJsApi(builderOptions)
  return createChainClientInternal<TPjsApi, Extrinsic, TPjsSigner>(pjsApi, chain)
}

export const createPolkadotJsApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (
    options: TArgs & { api: IPolkadotApi<TPjsApi, Extrinsic, TPjsSigner> }
  ) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: TPjsApiOrUrl }): Promise<TResult> => {
    const pjsApi = new PolkadotJsApi(options.api)

    const optionsWithApi = {
      ...options,
      api: pjsApi as IPolkadotApi<TPjsApi, Extrinsic, TPjsSigner>
    } as TArgs & { api: IPolkadotApi<TPjsApi, Extrinsic, TPjsSigner> }

    return apiCall(optionsWithApi)
  }
}

export const isEthersSigner = (signer: Signer | WalletClient): signer is Signer =>
  typeof signer === 'object' && signer !== null && 'provider' in signer

export const isEthersContract = (
  contract: Contract | GetContractReturnType<Abi | readonly unknown[]>
): contract is Contract => !('abi' in contract)
