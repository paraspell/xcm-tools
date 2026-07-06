import type {
  TDryRunResult,
  TGetXcmFeeResult,
  TTransferInfo,
  TXcmFeeDetail,
} from '@paraspell/sdk';

import type {
  TResultChains,
  TResultView,
} from '../components/common/resultDisplay';
import type { TQuerySubmitType } from '../types';

export const buildResultView = (
  submitType: TQuerySubmitType,
  result: unknown,
  chains: TResultChains,
): TResultView | undefined => {
  if (submitType === 'dryRun' || submitType === 'dryRunPreview') {
    return {
      variant: submitType,
      result: result as TDryRunResult,
      ...chains,
    };
  }

  if (submitType === 'getXcmFee') {
    return {
      variant: 'xcmFee',
      result: result as TGetXcmFeeResult,
      ...chains,
    };
  }

  if (submitType === 'getOriginXcmFee') {
    return {
      variant: 'originXcmFee',
      result: result as TXcmFeeDetail,
      ...chains,
    };
  }

  if (submitType === 'getTransferInfo') {
    return {
      variant: 'transferInfo',
      result: result as TTransferInfo,
      ...chains,
    };
  }

  return undefined;
};
