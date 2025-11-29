import { type ReactNode, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { TApiType } from '../../types';
import { decodeApiType } from '../../utils/routes/urlFilters';
import { SelectedApiTypeContext } from './SelectedApiTypeContext';

interface SelectedApiTypeProviderProps {
  children: ReactNode;
}

const SelectedApiTypeProvider = ({
  children,
}: SelectedApiTypeProviderProps) => {
  const [searchParams] = useSearchParams();
  const [selectedApiType, setSelectedApiType] = useState<TApiType | undefined>(
    decodeApiType(searchParams.get('apiType')),
  );

  return (
    <SelectedApiTypeContext.Provider
      value={{
        selectedApiType,
        setSelectedApiType,
      }}
    >
      {children}
    </SelectedApiTypeContext.Provider>
  );
};

export default SelectedApiTypeProvider;
