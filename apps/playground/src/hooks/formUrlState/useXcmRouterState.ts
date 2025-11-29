import { useContext } from 'react';

import { XcmRouterStateContext } from '../../providers/XcmRouterState/XcmRouterStateContext';

export const useXcmRouterState = () => {
  const context = useContext(XcmRouterStateContext);

  if (!context) {
    throw new Error(
      'useXcmRouterState must be used within a XcmRouterStateProvider',
    );
  }

  return context;
};
