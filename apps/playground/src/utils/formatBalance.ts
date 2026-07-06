import type { TAssetInfo } from '@paraspell/sdk';
import { formatUnits } from '@paraspell/sdk';

const MAX_DISPLAY_DECIMALS = 4;

export const formatBalance = (raw: bigint, decimals: number): string =>
  Number(formatUnits(raw, decimals)).toLocaleString('en-US', {
    maximumFractionDigits: MAX_DISPLAY_DECIMALS,
    useGrouping: false,
  });

export const formatAmount = (value: unknown, asset: TAssetInfo): string => {
  if (typeof value !== 'bigint' && typeof value !== 'string')
    return 'Unable to compute';
  return `${formatBalance(BigInt(value), asset.decimals)} ${asset.symbol}`;
};
