import type { TSubstrateChain } from '@paraspell/sdk';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { TPalletsQuery } from '../../types';
import {
  decodeBoolean,
  decodePalletsQuery,
  decodeSubstrateChain,
} from '../../utils/routes/urlFilters';
import { PalletQueryStateContext } from './PalletQueryStateContext';

interface PalletQueryStateProviderProps {
  children: ReactNode;
}

const PalletQueryStateProvider = ({
  children,
}: PalletQueryStateProviderProps) => {
  const [searchParams] = useSearchParams();

  const [func, setFunc] = useState<TPalletsQuery>(
    decodePalletsQuery(searchParams.get('func')),
  );

  const [chain, setChain] = useState<TSubstrateChain>(
    decodeSubstrateChain(searchParams.get('chain') ?? 'Acala'),
  );

  const [pallet, setPallet] = useState<string>(
    searchParams.get('pallet') ?? 'XTokens',
  );

  const [useApi, setUseApi] = useState<boolean>(
    decodeBoolean(searchParams.get('useApi')),
  );

  return (
    <PalletQueryStateContext.Provider
      value={{
        func,
        setFunc,
        chain,
        setChain,
        pallet,
        setPallet,
        useApi,
        setUseApi,
      }}
    >
      {children}
    </PalletQueryStateContext.Provider>
  );
};

export default PalletQueryStateProvider;
