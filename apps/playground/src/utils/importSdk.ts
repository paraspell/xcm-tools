import type {
  GeneralBuilder,
  TApiType,
  TBuilderConfig,
  TSubstrateChain,
  TUrl,
} from '@paraspell/sdk';
import type { TPapiTransaction } from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import type { DedotClient } from 'dedot';
import type { ChainSubmittableExtrinsic } from 'dedot/types';
import type { PolkadotClient } from 'polkadot-api';

export type TApi = ApiPromise | PolkadotClient | DedotClient;
export type TTransaction =
  | Extrinsic
  | TPapiTransaction
  | ChainSubmittableExtrinsic;

export const importSdk = async (apiType: TApiType) => {
  let Sdk;
  if (apiType === 'PAPI') {
    Sdk = await import('@paraspell/sdk');
  } else if (apiType === 'DEDOT') {
    Sdk = await import('@paraspell/sdk-dedot');
  } else {
    Sdk = await import('@paraspell/sdk-pjs');
  }

  const Builder = Sdk.Builder as (
    options?: TBuilderConfig<TUrl>,
  ) => GeneralBuilder;

  const createChainClient = Sdk.createChainClient as (
    chain: TSubstrateChain,
    options?: TBuilderConfig<TUrl>,
  ) => Promise<TApi>;

  return { ...Sdk, Builder, createChainClient };
};
