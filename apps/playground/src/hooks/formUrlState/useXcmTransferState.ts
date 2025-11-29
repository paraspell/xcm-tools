import { useContext } from 'react';

import { XcmTransferStateContext } from '../../providers/XcmTrasferState/XcmTrasferStateContext';

export const useXcmTransferState = () => {
  const context = useContext(XcmTransferStateContext);

  if (!context) {
    throw new Error(
      'useXcmTransferState must be used within a XcmTransferStateProvider',
    );
  }

  return context;
};
