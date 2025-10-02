import { useContext } from 'react';

import { LiveDataContext } from './LiveDataContext';

export const useLiveData = () => {
  const context = useContext(LiveDataContext);

  if (!context) {
    throw new Error('useLiveData must be used within LiveDataProvider');
  }

  return context;
};
