import type { TAssetInfo } from '@paraspell/sdk';
import { formatUnits } from '@paraspell/sdk';

const MAX_DISPLAY_DECIMALS = 4;
const SMALL_VALUE_SIGNIFICANT_DIGITS = 2;

export const formatBalance = (raw: bigint, decimals: number): string => {
  const value = Number(formatUnits(raw, decimals));
  const rounded = value.toLocaleString('en-US', {
    maximumFractionDigits: MAX_DISPLAY_DECIMALS,
    useGrouping: false,
  });
  if (raw === 0n || Number(rounded) !== 0) return rounded;
  return value.toLocaleString('en-US', {
    maximumSignificantDigits: SMALL_VALUE_SIGNIFICANT_DIGITS,
    useGrouping: false,
  });
};

export const formatAmount = (value: unknown, asset: TAssetInfo): string => {
  if (typeof value !== 'bigint' && typeof value !== 'string')
    return 'Unable to compute';
  return `${formatBalance(BigInt(value), asset.decimals)} ${asset.symbol}`;
};
