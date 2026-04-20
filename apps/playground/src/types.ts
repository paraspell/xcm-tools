import type {
  TAssetInfo,
  TChain,
  TExchangeChain,
  TPapiApi,
  TPapiTransaction,
  TSubstrateChain,
  TSwapEventType,
  TTransactionContext,
  TTransactOptions,
  Version,
} from '@paraspell/sdk';
import type { IconProps } from '@tabler/icons-react';
import type { PolkadotSigner } from 'polkadot-api';
import type { FC } from 'react';
import type { Web3 } from 'web3';

import type {
  ASSET_QUERIES,
  CURRENCY_TYPES,
  PALLETS_QUERIES,
  SYMBOL_TYPES,
  TRANSFER_CURRENCY_TYPES,
} from './constants';

export type TApiTransaction = Omit<
  TTransactionContext<TPapiApi, TPapiTransaction>,
  'tx'
> & {
  tx: string;
  wsProviders: string[];
};

export type TProgressSwapEvent = {
  type: TSwapEventType;
  routerPlan: Pick<TApiTransaction, 'type'>[];
  currentStep: number;
};

export type TAssetsQuery = (typeof ASSET_QUERIES)[number];

export type TPalletsQuery = (typeof PALLETS_QUERIES)[number];

export type TEthBridgeApiResponse = {
  token: string;
  destinationParaId: number;
  destinationFee: string;
  amount: string;
  fee: string;
};

type ValueType<T> = T extends Map<unknown, infer V> ? V : never;
export type EIP6963ProviderDetail = ValueType<
  Awaited<ReturnType<typeof Web3.requestEIP6963Providers>>
>;

export type TWalletAccount = {
  address: string;
  meta: {
    name?: string;
    source?: string;
  };
};

export type TExtension = {
  id: string;
  name: string;
};

export type TNavItem = {
  label: string;
  url: string;
  Icon: FC<IconProps>;
};

export type TQuerySubmitType =
  | 'dryRun'
  | 'dryRunPreview'
  | 'getXcmFee'
  | 'getOriginXcmFee'
  | 'getTransferableAmount'
  | 'getMinTransferableAmount'
  | 'getReceivableAmount'
  | 'getBestAmountOut'
  | 'verifyEdOnDestination'
  | 'getTransferInfo';

export type TSubmitType =
  | 'default'
  | 'update'
  | 'delete'
  | 'addToBatch'
  | TQuerySubmitType;

export type TEvmSubmitType = 'default' | 'approve' | 'deposit';

export type TEndpoint = {
  url: string;
};

export type TChainApiOverride = {
  chain: TChain;
  endpoints: TEndpoint[];
};

export type TAdvancedOptions = {
  from?: TChain;
  apiOverrides: TChainApiOverride[];
  development?: boolean;
  abstractDecimals?: boolean;
  xcmFormatCheck?: boolean;
  localAccount?: string;
  xcmVersion: Version | null;
  pallet?: string;
  method?: string;
};

export type TTransactFields = {
  transactOptions: TTransactOptions<string, string | number>;
};

export type TCurrencyType = (typeof CURRENCY_TYPES)[number];

export type TTransferCurrencyType = (typeof TRANSFER_CURRENCY_TYPES)[number];

export type TSymbolType = (typeof SYMBOL_TYPES)[number];

export type TCurrencyEntryBase = {
  currencyOptionId: string;
  customCurrency: string;
  isCustomCurrency: boolean;
  customCurrencyType?: TTransferCurrencyType;
  customCurrencySymbolSpecifier?: TSymbolType;
};

export type TCurrencyEntry = TCurrencyEntryBase & {
  amount: string;
  isMax?: boolean;
};

export type TCurrencyEntryBaseTransformed = TCurrencyEntryBase & {
  currency?: TAssetInfo;
};

export type TCurrencyEntryTransformed = TCurrencyEntry & {
  currency?: TAssetInfo;
};

export type TSwapOptions = {
  currencyTo: TCurrencyEntryBase;
  exchange: TExchangeChain[];
  slippage: string;
  evmSigner?: PolkadotSigner;
  evmInjectorAddress?: string;
};

export type TSwapFields = {
  swapOptions: TSwapOptions;
};

export type TFormValues = {
  from: TSubstrateChain;
  to: TChain;
  currencies: TCurrencyEntry[];
  feeAsset: TCurrencyEntryBase;
  recipient: string;
  ahAddress: string;
  useApi: boolean;
  keepAlive: boolean;
} & TAdvancedOptions &
  TTransactFields &
  TSwapFields;

export type TFormValuesTransformed = Omit<TFormValues, 'currencies'> & {
  currencies: TCurrencyEntryTransformed[];
  transformedFeeAsset?: TCurrencyEntryBaseTransformed;
  transformedCurrencyTo?: TCurrencyEntryBaseTransformed;
};
