import { useContext } from 'react';

import { EvmTransferStateContext } from '../../providers/EvmTransferState/EvmTransferStateContext';

export const useEvmTransferState = () => {
  const context = useContext(EvmTransferStateContext);

  if (!context) {
    throw new Error(
      'useEvmTransferState must be used within a EvmTransferStateProvider',
    );
  }

  return context;
};
