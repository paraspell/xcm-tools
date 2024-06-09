import { useContext } from 'react';
import { SelectedParachainContext } from './SelectedParachainContext';

export const useSelectedParachain = () => {
  const context = useContext(SelectedParachainContext);

  if (!context) {
    throw new Error('useSelectedParachain must be used within a SelectedParachainProvider');
  }

  return context;
};
