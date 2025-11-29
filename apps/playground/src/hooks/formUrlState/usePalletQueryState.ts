import { useContext } from 'react';

import { PalletQueryStateContext } from '../../providers/PalletQueryState/PalletQueryStateContext';

export const usePalletQueryState = () => {
  const context = useContext(PalletQueryStateContext);

  if (!context) {
    throw new Error(
      'usePalletQueryState must be used within a PalletQueryStateProvider',
    );
  }

  return context;
};
