import type { TRelaychain } from '@paraspell/sdk';
import type { ReactNode } from 'react';
import { createContext, useState } from 'react';
import { useSearchParams } from 'react-router';

import { decodeEcosystem } from '../../routes/urlFilters';

interface SelectedEcosystemContextType {
  selectedEcosystem: TRelaychain;
  setSelectedEcosystem: (ecosystem: TRelaychain) => void;
}

export const SelectedEcosystemContext = createContext<SelectedEcosystemContextType | null>(null);

interface SelectedEcosystemProviderProps {
  children: ReactNode;
}

export const SelectedEcosystemProvider = ({ children }: SelectedEcosystemProviderProps) => {
  // Set defaults from url params
  const [searchParams] = useSearchParams();
  const [selectedEcosystem, setSelectedEcosystem] = useState<TRelaychain>(
    decodeEcosystem(searchParams.get('ecosystem'), 'Polkadot')
  );

  return (
    <SelectedEcosystemContext.Provider
      value={{
        selectedEcosystem,
        setSelectedEcosystem
      }}
    >
      {children}
    </SelectedEcosystemContext.Provider>
  );
};
