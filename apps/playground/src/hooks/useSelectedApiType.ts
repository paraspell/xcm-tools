import { useContext } from 'react';

import { SelectedApiTypeContext } from '../providers/SelectedApiType/SelectedApiTypeContext';

export const useSelectedApiType = () => {
  const context = useContext(SelectedApiTypeContext);

  if (!context) {
    throw new Error(
      'useSelectedApiType must be used within a SelectedApiTypeProvider',
    );
  }

  return context;
};
