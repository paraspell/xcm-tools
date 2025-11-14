import { useContext } from 'react';

import { SelectedEcosystemContext } from './SelectedEcosystemContext';

export const useSelectedEcosystem = () => {
  const context = useContext(SelectedEcosystemContext);

  if (!context) {
    throw new Error('useSelectedEcosystem must be used within a SelectedEcosystemProvider');
  }

  return context;
};
