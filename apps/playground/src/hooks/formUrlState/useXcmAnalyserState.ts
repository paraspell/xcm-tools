import { useContext } from 'react';

import { XcmAnalyserStateContext } from '../../providers/XcmAnalyserState/XcmAnalyserStateContext';

export const useXcmAnalyserState = () => {
  const context = useContext(XcmAnalyserStateContext);

  if (!context) {
    throw new Error(
      'useXcmAnalyserState must be used within a XcmAnalyserStateProvider',
    );
  }

  return context;
};
