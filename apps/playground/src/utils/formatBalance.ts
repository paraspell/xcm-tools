import { formatUnits } from '@paraspell/sdk';

const MAX_DISPLAY_DECIMALS = 4;

export const formatBalance = (raw: bigint, decimals: number): string =>
  Number(formatUnits(raw, decimals)).toLocaleString('en-US', {
    maximumFractionDigits: MAX_DISPLAY_DECIMALS,
    useGrouping: false,
  });
