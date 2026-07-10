import type {
  TAssetInfo,
  TChain,
  TDryRunChainResult,
  TDryRunError,
  TDryRunResult,
  TFeeType,
  TGetXcmFeeResult,
  TWeight,
  TXcmFeeDetail,
} from '@paraspell/sdk';

export type TStop = {
  key: string;
  role: string;
  chain?: TChain;
  success: boolean;
  isExchange?: boolean;
  asset?: TAssetInfo;
  fee?: bigint;
  weight?: TWeight;
  destParaId?: number;
  forwardedXcms?: unknown;
  sufficient?: boolean;
  feeType?: TFeeType;
  dryRunError?: TDryRunError;
};

type TStopData = Omit<TStop, 'key' | 'role' | 'chain'>;

const normalizeDryRunStop = (result: TDryRunChainResult): TStopData =>
  result.success
    ? {
        success: true,
        isExchange: result.isExchange,
        asset: result.asset,
        fee: result.fee,
        weight: result.weight,
        destParaId: result.destParaId,
        forwardedXcms: result.forwardedXcms,
      }
    : {
        success: false,
        isExchange: result.isExchange,
        asset: result.asset,
        dryRunError: result.dryRunError,
      };

const normalizeFeeStop = (result: TXcmFeeDetail): TStopData => ({
  success: result.dryRunError === undefined,
  isExchange: result.isExchange,
  asset: result.asset,
  fee: result.fee,
  weight: result.weight,
  sufficient: result.sufficient,
  feeType: result.feeType,
  dryRunError: result.dryRunError,
});

export const buildDryRunStops = (
  result: TDryRunResult,
  originChain: TChain,
  destChain: TChain,
): TStop[] => [
  {
    key: 'origin',
    role: 'Origin',
    chain: originChain,
    ...normalizeDryRunStop(result.origin),
  },
  ...(result.hops ?? []).map((hop, i) => ({
    key: `hop-${i}`,
    role: 'Hop',
    chain: hop.chain,
    ...normalizeDryRunStop(hop.result),
  })),
  ...(result.destination
    ? [
        {
          key: 'destination',
          role: 'Destination',
          chain: destChain,
          ...normalizeDryRunStop(result.destination),
        },
      ]
    : []),
];

export const buildFeeStops = (
  result: TGetXcmFeeResult,
  originChain: TChain,
  destChain: TChain,
): TStop[] => [
  {
    key: 'origin',
    role: 'Origin',
    chain: originChain,
    ...normalizeFeeStop(result.origin),
  },
  ...result.hops.map((hop, i) => ({
    key: `hop-${i}`,
    role: 'Hop',
    chain: hop.chain,
    ...normalizeFeeStop(hop.result),
  })),
  {
    key: 'destination',
    role: 'Destination',
    chain: destChain,
    ...normalizeFeeStop(result.destination),
  },
];

export const buildOriginFeeStops = (
  result: TXcmFeeDetail,
  originChain: TChain,
): TStop[] => [
  {
    key: 'origin',
    role: 'Origin',
    chain: originChain,
    ...normalizeFeeStop(result),
  },
];
