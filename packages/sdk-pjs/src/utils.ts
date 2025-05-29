import type { IPolkadotApi, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-core'
import { createApiInstanceForNode as createApiInstanceForNodeInternal } from '@paraspell/sdk-core'
import type { Contract, Signer } from 'ethers'
import type { Abi, GetContractReturnType, WalletClient } from 'viem'

import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'

export const createApiInstanceForNode = (node: TNodeDotKsmWithRelayChains) => {
  const pjsApi = new PolkadotJsApi()
  return createApiInstanceForNodeInternal<TPjsApi, Extrinsic>(pjsApi, node)
}

export const createPolkadotJsApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (options: TArgs & { api: IPolkadotApi<TPjsApi, Extrinsic> }) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: TPjsApiOrUrl }): Promise<TResult> => {
    const pjsApi = new PolkadotJsApi()
    pjsApi.setApi(options.api)

    const optionsWithApi = {
      ...options,
      api: pjsApi as IPolkadotApi<TPjsApi, Extrinsic>
    } as TArgs & { api: IPolkadotApi<TPjsApi, Extrinsic> }

    return apiCall(optionsWithApi)
  }
}

export const isEthersSigner = (signer: Signer | WalletClient): signer is Signer =>
  typeof signer === 'object' && signer !== null && 'provider' in signer

export const isEthersContract = (
  contract: Contract | GetContractReturnType<Abi | readonly unknown[]>
): contract is Contract => !('abi' in contract)
