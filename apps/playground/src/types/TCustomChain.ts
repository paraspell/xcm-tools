import type {
  TAssetsPallet,
  TChainAssetsInfo,
  TCustomChainInput,
  TRelaychain,
  Version,
} from '@paraspell/sdk';

export type TCustomChainProviderEntry = {
  name: string;
  endpoint: string;
};

export type TCustomChainAssetEntry = {
  symbol: string;
  decimals: number | '';
  assetId: string;
  location: string;
  isNative: boolean;
};

export type TStoredCustomChain = {
  input: TCustomChainInput;
  assetsInfo: TChainAssetsInfo;
};

export type TStoredCustomChains = Record<string, TStoredCustomChain>;

export type TCustomChainFormValues = {
  name: string;
  paraId: number | '';
  ecosystem: TRelaychain;
  xcmVersion: Version;
  ss58Prefix: number | '';
  providers: TCustomChainProviderEntry[];
  assets: TCustomChainAssetEntry[];
  pallets: {
    nativeAssets: TAssetsPallet | '';
    otherAssets: TAssetsPallet[];
  };
};
