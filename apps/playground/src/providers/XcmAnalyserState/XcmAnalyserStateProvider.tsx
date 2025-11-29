import { type ReactNode, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { decodeBoolean, decodeCodeString } from '../../utils/routes/urlFilters';
import { XcmAnalyserStateContext } from './XcmAnalyserStateContext';

interface XcmAnalyserStateProviderProps {
  children: ReactNode;
}

const XcmAnalyserStateProvider = ({
  children,
}: XcmAnalyserStateProviderProps) => {
  const [searchParams] = useSearchParams();

  const [input, setInput] = useState<string>(
    decodeCodeString(searchParams.get('input')),
  );

  const [useApi, setUseApi] = useState<boolean>(
    decodeBoolean(searchParams.get('useApi')),
  );

  return (
    <XcmAnalyserStateContext.Provider
      value={{
        input,
        setInput,
        useApi,
        setUseApi,
      }}
    >
      {children}
    </XcmAnalyserStateContext.Provider>
  );
};

export default XcmAnalyserStateProvider;
